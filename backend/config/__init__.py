# Carrega o Celery junto com o Django, para o @shared_task usar esta aplicação.
from .celery import app as celery_app

__all__ = ("celery_app",)
