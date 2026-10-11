from celery import shared_task

from config.tracing import get_logger

from .models import User
from .whatsapp import WhatsAppError, mask_phone, send_text

logger = get_logger(__name__)

VERIFICATION_MESSAGE = "[SAWA] Seu código chegou: {code}"


# Tenta de novo se a Evolution API falhar (fora do ar, timeout, WhatsApp desconectado...).
@shared_task(bind=True, autoretry_for=(WhatsAppError,), retry_backoff=True, max_retries=3)
def send_verification_code(self, user_id: int, code: str) -> None:
    """Envia o código de confirmação pelo WhatsApp. Roda no worker do Celery (ou na hora, em desenvolvimento)."""
    user = User.objects.filter(pk=user_id).first()
    if user is None or not user.phone:
        logger.warning("Usuário %s não existe mais ou está sem WhatsApp; envio cancelado", user_id)
        return
    attempt = self.request.retries + 1
    logger.info("Tarefa Celery: enviando o código para %s (tentativa %s)", mask_phone(user.phone), attempt)
    send_text(user.phone, VERIFICATION_MESSAGE.format(code=code))
