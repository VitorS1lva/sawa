"""
Envio de mensagens de WhatsApp.

O modo vem de WHATSAPP_BACKEND no .env:
- "console": imprime a mensagem no terminal (padrão, para desenvolvimento);
- "evolution": envia de verdade pela Evolution API v2 (POST /message/sendText/{instância});
- "locmem": guarda em `outbox`, para os testes automáticos.
"""

import re
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from config.tracing import get_logger

logger = get_logger(__name__)

# Mensagens enviadas no modo "locmem" (só nos testes).
outbox: list[dict[str, str]] = []


class WhatsAppError(Exception):
    """A Evolution API recusou a mensagem ou não respondeu."""


def normalize_phone(raw: str) -> str:
    """
    Deixa só os dígitos, no formato do WhatsApp: DDI + DDD + número (ex.: 5511999999999).
    Números brasileiros sem DDI ("(11) 99999-9999") ganham o 55.
    """
    digits = re.sub(r"\D", "", raw)
    if not raw.strip().startswith("+") and len(digits) in (10, 11):
        digits = f"55{digits}"
    # Brasil: 55 + DDD + 8 ou 9 dígitos. Outros países: até 15 dígitos (padrão E.164).
    valid = len(digits) in (12, 13) if digits.startswith("55") else 11 <= len(digits) <= 15
    if not valid:
        raise ValueError("Informe o número com DDD, por exemplo (11) 99999-9999.")
    return digits


def mask_phone(phone: str) -> str:
    """Mostra só o fim do número: 5511999998888 → "+55 11 •••••-8888"."""
    return f"+{phone[:2]} {phone[2:4]} •••••-{phone[-4:]}"


def send_text(phone: str, message: str) -> None:
    backend = settings.WHATSAPP_BACKEND
    logger.trace("Modo de envio do WhatsApp: %s", backend)
    if backend == "console":
        # print, e não log: a mensagem tem o código, que não pode ir para o navegador junto com os logs.
        print(f"\n[WhatsApp para +{phone}]\n{message}\n", flush=True)
        logger.info("Modo console: mensagem impressa no terminal do runserver (fora do log)")
    elif backend == "locmem":
        outbox.append({"phone": phone, "message": message})
    elif backend == "evolution":
        _send_with_evolution(phone, message)
    else:
        raise ImproperlyConfigured(f'WHATSAPP_BACKEND inválido: "{backend}". Use console, evolution ou locmem.')


def _send_with_evolution(phone: str, message: str) -> None:
    base_url, instance, api_key = settings.EVOLUTION_API_URL, settings.EVOLUTION_INSTANCE, settings.EVOLUTION_API_KEY
    if not (base_url and instance and api_key):
        raise ImproperlyConfigured("Preencha EVOLUTION_API_URL, EVOLUTION_INSTANCE e EVOLUTION_API_KEY no .env.")

    url = f"{base_url.rstrip('/')}/message/sendText/{quote(instance, safe='')}"
    logger.debug("POST %s (Evolution API, instância %s)", url, instance)
    try:
        response = requests.post(
            url,
            json={"number": phone, "text": message},
            headers={"apikey": api_key},
            timeout=15,
        )
    except requests.RequestException as error:
        raise WhatsAppError(f"Evolution API não respondeu: {error.__class__.__name__}") from error

    if response.status_code >= 400:
        logger.error("Evolution API recusou a mensagem (%s): %s", response.status_code, response.text[:300])
        raise WhatsAppError(f"Evolution API respondeu {response.status_code}.")
    logger.info("Evolution API aceitou a mensagem para %s (HTTP %s)", mask_phone(phone), response.status_code)
