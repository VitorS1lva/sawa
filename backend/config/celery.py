"""Aplicação Celery: tarefas em segundo plano (ex.: envio de e-mails)."""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")
# Lê as configurações CELERY_* do settings.py.
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
