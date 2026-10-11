"""
Logs no formato do projeto, no terminal e no console do navegador.

    [INFO ~ 11-10-2026 | 14:22:01] accounts.views.SignupView.post - Cadastro recebido para ana@exemplo.com

- `get_logger(__name__)`: logger com o nível extra TRACE (abaixo de DEBUG), para o passo a passo do fluxo.
- `AppFormatter`: o formato acima; o "local" é o módulo + a função (com a classe, quando houver).
- `RequestTraceMiddleware`: registra cada requisição e, com TRACE_TO_CLIENT, devolve no cabeçalho
  `X-Trace` os logs gerados durante ela. O front-end imprime esses logs no console do navegador
  (veja frontend/src/lib/log/logger.ts), mostrando o caminho da requisição dentro do back-end.

Nunca registre senhas, tokens ou o código de confirmação: com TRACE_TO_CLIENT, os logs vão para o navegador.
"""

import base64
import json
import logging
import re
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from time import perf_counter
from typing import cast
from zoneinfo import ZoneInfo

from django.conf import settings

TRACE = 5
logging.addLevelName(TRACE, "TRACE")


class AppLogger(logging.Logger):
    def trace(self, message, *args, **kwargs):
        if self.isEnabledFor(TRACE):
            # +1: o local do log é quem chamou trace(), não este método.
            kwargs["stacklevel"] = kwargs.get("stacklevel", 1) + 1
            self._log(TRACE, message, args, **kwargs)


logging.setLoggerClass(AppLogger)


def get_logger(name: str) -> AppLogger:
    return cast(AppLogger, logging.getLogger(name))


logger = get_logger(__name__)


# ---------- Local do código ----------

_default_record_factory = logging.getLogRecordFactory()


def _record_factory(*args, **kwargs) -> logging.LogRecord:
    """Acrescenta `record.where` (ex.: "accounts.views.SignupView.post") a cada log."""
    record = _default_record_factory(*args, **kwargs)
    record.where = f"{record.name}.{_qualname(record)}"
    return record


def _qualname(record: logging.LogRecord) -> str:
    # O LogRecord só traz o nome da função ("post"); o frame que gerou o log tem o nome completo ("SignupView.post").
    frame = sys._getframe(1)
    while frame is not None:
        if frame.f_lineno == record.lineno and frame.f_code.co_filename == record.pathname:
            return frame.f_code.co_qualname.replace("<locals>.", "")
        frame = frame.f_back
    return record.funcName


logging.setLogRecordFactory(_record_factory)


# ---------- Formato ----------

LEVEL_COLORS = {"TRACE": 90, "DEBUG": 36, "INFO": 32, "WARNING": 33, "ERROR": 31, "CRITICAL": 41}


class AppFormatter(logging.Formatter):
    """[NÍVEL ~ DD-MM-AAAA | HH:MM:SS] local.da.funcao - mensagem"""

    def __init__(self, *args, tz: str = "UTC", color: bool = False, **kwargs):
        super().__init__(*args, **kwargs)
        self.tz = ZoneInfo(tz)
        self.color = color

    def format(self, record: logging.LogRecord) -> str:
        when = datetime.fromtimestamp(record.created, self.tz)
        level = record.levelname
        if self.color:
            level = f"\033[{LEVEL_COLORS.get(level, 0)}m{level}\033[0m"
        line = f"[{level} ~ {when:%d-%m-%Y | %H:%M:%S}] {getattr(record, 'where', record.name)} - {record.getMessage()}"
        if record.exc_info:
            line += "\n" + self.formatException(record.exc_info)
        return line


# ---------- Logs por requisição ----------

# Logs da requisição em andamento (None fora de uma requisição, ex.: no worker do Celery).
_request_trace: ContextVar[list[dict] | None] = ContextVar("request_trace", default=None)

MAX_TRACE_ENTRIES = 100
MAX_MESSAGE_LENGTH = 500


class RequestTraceHandler(logging.Handler):
    """Guarda os logs da requisição atual, para o middleware devolver ao front-end."""

    def emit(self, record: logging.LogRecord) -> None:
        entries = _request_trace.get()
        if entries is None or len(entries) >= MAX_TRACE_ENTRIES:
            return
        entries.append(
            {
                "level": record.levelname,
                "time": round(record.created * 1000),
                "where": getattr(record, "where", record.name),
                "message": record.getMessage()[:MAX_MESSAGE_LENGTH],
            }
        )


# O front-end manda um id por requisição; aceita só um formato curto e seguro, ou gera um.
_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{1,64}$")


class RequestTraceMiddleware:
    """Registra início, fim e duração de cada requisição e devolve os logs dela em `X-Trace`."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID", "")
        if not _REQUEST_ID.match(request_id):
            request_id = uuid.uuid4().hex[:8]

        entries: list[dict] = []
        token = _request_trace.set(entries)
        started = perf_counter()
        try:
            logger.info("%s %s recebida (requisição %s)", request.method, request.path, request_id)
            response = self.get_response(request)
            elapsed = (perf_counter() - started) * 1000
            status = response.status_code
            level = logging.INFO if status < 400 else logging.WARNING if status < 500 else logging.ERROR
            logger.log(level, "%s %s respondeu %s em %.0f ms", request.method, request.path, status, elapsed)
        finally:
            _request_trace.reset(token)

        response["X-Request-ID"] = request_id
        if settings.TRACE_TO_CLIENT:
            # Base64: o cabeçalho HTTP não aceita acentos.
            response["X-Trace"] = base64.b64encode(json.dumps(entries, ensure_ascii=False).encode()).decode()
        return response


def exception_handler(exc, context):
    """Tratador de erros do DRF que registra o motivo (campos inválidos, limite de requisições...)."""
    # Import tardio: este módulo é carregado na configuração dos logs, antes do DRF estar pronto.
    from rest_framework.views import exception_handler as drf_exception_handler

    response = drf_exception_handler(exc, context)
    if response is not None:
        view = type(context["view"]).__name__
        data = response.data
        if isinstance(data, dict) and isinstance(data.get("detail"), str):
            logger.warning("%s: %s (%s)", view, data["detail"], type(exc).__name__)
        elif isinstance(data, dict):
            # Erros de validação: só os nomes dos campos (os valores podem ter senha).
            logger.warning("%s: dados inválidos nos campos %s", view, ", ".join(data))
        else:
            logger.warning("%s: %s (%s)", view, data, type(exc).__name__)
    return response
