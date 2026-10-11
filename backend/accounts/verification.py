"""
Código de confirmação do cadastro: gera, guarda (só o hash), envia pelo WhatsApp e confere.

Regras:
- 6 dígitos, válido por 10 minutos;
- no máximo 5 tentativas por código (depois disso, só pedindo um novo);
- um novo código só pode ser enviado 60 segundos depois do anterior.
"""

import hashlib
import hmac
import secrets
from datetime import timedelta
from enum import Enum

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from config.tracing import get_logger

from .models import PhoneVerification, User
from .tasks import send_verification_code

logger = get_logger(__name__)

CODE_LENGTH = 6
CODE_TTL = timedelta(minutes=10)
MAX_ATTEMPTS = 5
RESEND_COOLDOWN = timedelta(seconds=60)


class CodeStatus(Enum):
    VALID = "valid"
    INVALID = "invalid"
    EXPIRED = "expired"
    TOO_MANY_ATTEMPTS = "too_many_attempts"
    NOT_FOUND = "not_found"


def _generate_code() -> str:
    return f"{secrets.randbelow(10**CODE_LENGTH):0{CODE_LENGTH}d}"


def _hash_code(user: User, code: str) -> str:
    # HMAC com a SECRET_KEY e o id do usuário: o mesmo código gera hashes diferentes por usuário.
    message = f"{user.pk}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()


def seconds_until_resend(user: User) -> int:
    """Quanto falta para poder enviar outro código (0 = já pode)."""
    verification = PhoneVerification.objects.filter(user=user).first()
    if verification is None:
        return 0
    remaining = verification.sent_at + RESEND_COOLDOWN - timezone.now()
    return max(0, int(remaining.total_seconds()) + (1 if remaining.microseconds else 0))


def issue_code(user: User) -> None:
    """Gera um código novo (invalidando o anterior) e envia pelo WhatsApp do usuário."""
    code = _generate_code()
    now = timezone.now()
    # O código em si nunca vai para o log: com TRACE_TO_CLIENT, o log chega ao navegador.
    logger.trace("Código de %s dígitos gerado para o usuário %s", CODE_LENGTH, user.pk)
    PhoneVerification.objects.update_or_create(
        user=user,
        defaults={
            "code_hash": _hash_code(user, code),
            "sent_at": now,
            "expires_at": now + CODE_TTL,
            "attempts": 0,
        },
    )
    logger.debug(
        "Hash HMAC-SHA256 do código salvo; vale até %s",
        timezone.localtime(now + CODE_TTL).strftime("%H:%M:%S"),
    )

    def send():
        # Se o WhatsApp falhar (Evolution fora do ar, número desconectado...), o cadastro continua:
        # o usuário pode pedir "Reenviar código". O erro fica no log.
        try:
            logger.debug("Transação confirmada; enviando a tarefa de envio para o Celery")
            send_verification_code.delay(user.pk, code)
        except Exception:
            logger.exception("Não foi possível enviar o código de confirmação para o usuário %s.", user.pk)

    # Só envia depois que o código estiver salvo no banco.
    logger.trace("Envio agendado para depois do commit da transação")
    transaction.on_commit(send)


@transaction.atomic
def check_code(user: User, code: str) -> CodeStatus:
    """Confere o código. Se estiver certo, confirma o WhatsApp do usuário e apaga o código."""
    # Trava a linha para duas tentativas simultâneas não burlarem o limite.
    verification = PhoneVerification.objects.select_for_update().filter(user=user).first()
    if verification is None:
        logger.debug("Nenhum código pendente para o usuário %s", user.pk)
        return CodeStatus.NOT_FOUND
    if verification.attempts >= MAX_ATTEMPTS:
        logger.debug("Limite de %s tentativas já atingido", MAX_ATTEMPTS)
        return CodeStatus.TOO_MANY_ATTEMPTS
    if timezone.now() >= verification.expires_at:
        logger.debug("Código expirado (validade de %s minutos)", int(CODE_TTL.total_seconds() // 60))
        return CodeStatus.EXPIRED

    logger.trace("Comparando o hash do código digitado com o salvo (comparação em tempo constante)")
    if not hmac.compare_digest(verification.code_hash, _hash_code(user, code)):
        verification.attempts += 1
        verification.save(update_fields=["attempts"])
        logger.debug("Código não confere; tentativa %s de %s", verification.attempts, MAX_ATTEMPTS)
        return CodeStatus.INVALID

    logger.debug("Código confere; registro do código apagado")
    verification.delete()
    user.phone_verified_at = timezone.now()
    user.save(update_fields=["phone_verified_at"])
    return CodeStatus.VALID
