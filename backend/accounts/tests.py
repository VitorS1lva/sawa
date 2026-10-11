import re
from datetime import timedelta
from unittest import mock

import requests
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from config.celery import app as celery_app

from . import whatsapp
from .models import PhoneVerification, User
from .verification import MAX_ATTEMPTS

PASSWORD = "senha-forte-123"
PHONE = "(11) 99999-8888"
PHONE_DIGITS = "5511999998888"


def code_from_last_message() -> str:
    return re.search(r"\b(\d{6})\b", whatsapp.outbox[-1]["message"]).group(1)


@override_settings(WHATSAPP_BACKEND="locmem")
class AuthFlowTests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # As mensagens são enviadas na hora, sem worker.
        celery_app.conf.task_always_eager = True

    def setUp(self):
        # Os contadores do limite de requisições ficam no cache; zera entre os testes.
        cache.clear()
        whatsapp.outbox.clear()

    def signup(self, email="ana@exemplo.com", password=PASSWORD, name="Ana", phone=PHONE):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(
                reverse("signup"), {"name": name, "email": email, "phone": phone, "password": password}
            )

    def verify(self, code, email="ana@exemplo.com"):
        return self.client.post(reverse("verify-code"), {"email": email, "code": code})

    def login(self, email="ana@exemplo.com", password=PASSWORD):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(reverse("login"), {"email": email, "password": password})

    # ---------- Cadastro ----------

    def test_signup_creates_unverified_user_and_sends_code_by_whatsapp(self):
        response = self.signup()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["phone"], "+55 11 •••••-8888")
        self.assertEqual(response.data["resend_available_in"], 60)
        user = User.objects.get(email="ana@exemplo.com")
        self.assertEqual(user.phone, PHONE_DIGITS)
        self.assertFalse(user.is_phone_verified)
        self.assertEqual(len(whatsapp.outbox), 1)
        self.assertEqual(whatsapp.outbox[0]["phone"], PHONE_DIGITS)
        code = code_from_last_message()
        self.assertEqual(whatsapp.outbox[0]["message"], f"[SAWA] Seu código chegou: {code}")
        # O código não fica salvo em texto no banco.
        self.assertNotEqual(PhoneVerification.objects.get(user=user).code_hash, code)

    # A tarefa importa send_text direto do módulo; o patch vale onde ela é usada.
    @mock.patch("accounts.tasks.send_text", side_effect=whatsapp.WhatsAppError("fora do ar"))
    def test_signup_still_works_if_whatsapp_is_down(self, send_text):
        with self.assertLogs("accounts.verification", level="ERROR"):
            response = self.signup()

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="ana@exemplo.com").exists())

    def test_signup_normalizes_email_and_phone(self):
        self.signup(email="  Ana@Exemplo.COM ", phone="+55 (11) 99999-8888")
        user = User.objects.get(email="ana@exemplo.com")
        self.assertEqual(user.phone, PHONE_DIGITS)

    def test_signup_rejects_invalid_phone(self):
        response = self.signup(phone="9999-8888")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)
        self.assertFalse(User.objects.exists())

    def test_signup_rejects_weak_password(self):
        response = self.signup(password="12345678")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.exists())

    def test_signup_with_verified_email_is_rejected(self):
        self.signup()
        self.verify(code_from_last_message())

        response = self.signup(phone="(21) 98888-7777")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "email_taken")

    def test_signup_with_phone_of_verified_account_is_rejected(self):
        self.signup()
        self.verify(code_from_last_message())

        response = self.signup(email="outra@exemplo.com")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "phone_taken")

    def test_pending_signup_does_not_lock_the_phone(self):
        # Alguém cadastrou o número de outra pessoa e não confirmou.
        self.signup(email="intruso@exemplo.com")

        response = self.signup(email="dona@exemplo.com")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.get(email="dona@exemplo.com").phone, PHONE_DIGITS)
        self.assertIsNone(User.objects.get(email="intruso@exemplo.com").phone)
        self.assertEqual(self.verify(code_from_last_message(), email="dona@exemplo.com").status_code, 200)

    def test_signup_again_while_pending_updates_data_without_spamming(self):
        self.signup(password=PASSWORD)
        self.signup(password="outra-senha-forte-456", name="Ana Maria")

        user = User.objects.get(email="ana@exemplo.com")
        self.assertEqual(user.name, "Ana Maria")
        self.assertTrue(user.check_password("outra-senha-forte-456"))
        # Mesmo número, ainda dentro do intervalo de 60 s: não envia outra mensagem.
        self.assertEqual(len(whatsapp.outbox), 1)

    def test_signup_again_with_corrected_phone_sends_code_to_new_number(self):
        self.signup(phone="(11) 90000-0000")
        self.signup(phone=PHONE)

        self.assertEqual(len(whatsapp.outbox), 2)
        self.assertEqual(whatsapp.outbox[-1]["phone"], PHONE_DIGITS)

    # ---------- Confirmação ----------

    def test_correct_code_verifies_phone_and_returns_tokens(self):
        self.signup()

        response = self.verify(code_from_last_message())

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "ana@exemplo.com")
        self.assertEqual(response.data["user"]["phone"], PHONE_DIGITS)
        self.assertTrue(User.objects.get(email="ana@exemplo.com").is_phone_verified)
        self.assertFalse(PhoneVerification.objects.exists())

    def test_wrong_code_is_rejected_and_counts_attempts(self):
        self.signup()
        code = code_from_last_message()
        wrong = "000000" if code != "000000" else "111111"

        response = self.verify(wrong)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "invalid")
        self.assertEqual(PhoneVerification.objects.get().attempts, 1)

    def test_code_is_blocked_after_max_attempts_even_if_correct(self):
        self.signup()
        code = code_from_last_message()
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(MAX_ATTEMPTS):
            self.verify(wrong)

        response = self.verify(code)

        self.assertEqual(response.data["code"], "too_many_attempts")
        self.assertFalse(User.objects.get().is_phone_verified)

    def test_expired_code_is_rejected(self):
        self.signup()
        code = code_from_last_message()
        PhoneVerification.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        response = self.verify(code)

        self.assertEqual(response.data["code"], "expired")

    def test_unknown_email_looks_like_wrong_code(self):
        response = self.verify("123456", email="ninguem@exemplo.com")
        self.assertEqual(response.data["code"], "invalid")

    def test_code_must_have_6_digits(self):
        self.signup()
        response = self.verify("12345")
        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.data)

    # ---------- Reenvio ----------

    def test_resend_respects_cooldown(self):
        self.signup()
        first_code = code_from_last_message()

        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(reverse("resend-code"), {"email": "ana@exemplo.com"})
        self.assertEqual(len(whatsapp.outbox), 1)

        # Passado o intervalo, envia um código novo e o anterior deixa de valer.
        PhoneVerification.objects.update(sent_at=timezone.now() - timedelta(seconds=61))
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(reverse("resend-code"), {"email": "ana@exemplo.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(whatsapp.outbox), 2)
        new_code = code_from_last_message()
        if new_code != first_code:
            self.assertEqual(self.verify(first_code).data["code"], "invalid")
        self.assertEqual(self.verify(new_code).status_code, 200)

    def test_resend_for_unknown_email_gives_same_answer(self):
        response = self.client.post(reverse("resend-code"), {"email": "ninguem@exemplo.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(whatsapp.outbox), 0)

    # ---------- Login ----------

    def test_login_before_verification_is_blocked(self):
        self.signup()

        response = self.login()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "phone_not_verified")
        self.assertEqual(response.data["phone"], "+55 11 •••••-8888")

    def test_login_before_verification_resends_code_after_cooldown(self):
        self.signup()
        PhoneVerification.objects.update(sent_at=timezone.now() - timedelta(seconds=61))

        self.login()

        self.assertEqual(len(whatsapp.outbox), 2)

    def test_login_with_wrong_password_does_not_reveal_verification_status(self):
        self.signup()
        response = self.login(password="senha-errada-999")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["code"], "wrong_password")
        self.assertEqual(response.data["password"], ["Senha incorreta."])

    def test_login_without_account_points_to_email(self):
        response = self.login(email="ninguem@exemplo.com")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["code"], "account_not_found")
        self.assertEqual(response.data["email"], ["Não encontramos uma conta com este e-mail."])

    def test_login_with_malformed_email_points_to_email(self):
        response = self.login(email="ana@exemplo")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_login_after_verification_returns_tokens_and_user(self):
        self.signup()
        self.verify(code_from_last_message())

        response = self.login(email="ANA@exemplo.com")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["name"], "Ana")
        self.assertIn("access", response.data)

    # ---------- Sessão ----------

    def test_me_requires_token(self):
        self.assertEqual(self.client.get(reverse("me")).status_code, 401)

    def test_me_refresh_and_logout(self):
        self.signup()
        tokens = self.verify(code_from_last_message()).data

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        me = self.client.get(reverse("me"))
        self.assertEqual(me.data["email"], "ana@exemplo.com")
        self.client.credentials()

        refreshed = self.client.post(reverse("token-refresh"), {"refresh": tokens["refresh"]})
        self.assertEqual(refreshed.status_code, 200)

        # Sair invalida o refresh; ele não pode mais ser usado.
        new_refresh = refreshed.data["refresh"]
        self.assertEqual(self.client.post(reverse("logout"), {"refresh": new_refresh}).status_code, 200)
        self.assertEqual(self.client.post(reverse("token-refresh"), {"refresh": new_refresh}).status_code, 401)

    def test_delete_account(self):
        self.signup()
        tokens = self.verify(code_from_last_message()).data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        self.assertEqual(self.client.delete(reverse("me")).status_code, 204)

        self.assertFalse(User.objects.exists())
        # O refresh do usuário excluído também deixa de funcionar.
        self.client.credentials()
        self.assertEqual(self.client.post(reverse("token-refresh"), {"refresh": tokens["refresh"]}).status_code, 401)


class ThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_login_is_rate_limited_per_ip(self):
        # O DRF lê as taxas na importação; aplica a taxa do teste na classe.
        with mock.patch("rest_framework.throttling.ScopedRateThrottle.THROTTLE_RATES", {"auth_login": "2/min"}):
            codes = [
                self.client.post(reverse("login"), {"email": "x@exemplo.com", "password": "errada"}).status_code
                for _ in range(3)
            ]
        self.assertEqual(codes, [401, 401, 429])


@override_settings(
    WHATSAPP_BACKEND="evolution",
    EVOLUTION_API_URL="http://evolution.local:8080/",
    EVOLUTION_INSTANCE="sawa",
    EVOLUTION_API_KEY="CHAVE",
)
class EvolutionApiTests(SimpleTestCase):
    @mock.patch("accounts.whatsapp.requests.post")
    def test_sends_text_to_evolution_api(self, post):
        post.return_value = mock.Mock(status_code=201, text="{}")

        whatsapp.send_text(PHONE_DIGITS, "[SAWA] Seu código chegou: 123456")

        post.assert_called_once_with(
            "http://evolution.local:8080/message/sendText/sawa",
            json={"number": PHONE_DIGITS, "text": "[SAWA] Seu código chegou: 123456"},
            headers={"apikey": "CHAVE"},
            timeout=15,
        )

    @mock.patch("accounts.whatsapp.requests.post")
    def test_evolution_error_raises_for_retry(self, post):
        post.return_value = mock.Mock(status_code=400, text='{"message":"number não existe"}')
        with self.assertRaises(whatsapp.WhatsAppError):
            whatsapp.send_text(PHONE_DIGITS, "teste")

    @mock.patch("accounts.whatsapp.requests.post", side_effect=requests.ConnectionError())
    def test_evolution_offline_raises_for_retry(self, post):
        with self.assertRaises(whatsapp.WhatsAppError):
            whatsapp.send_text(PHONE_DIGITS, "teste")

    @override_settings(EVOLUTION_API_KEY="")
    def test_missing_settings_fail_clearly(self):
        from django.core.exceptions import ImproperlyConfigured

        with self.assertRaises(ImproperlyConfigured):
            whatsapp.send_text(PHONE_DIGITS, "teste")


class PhoneFormatTests(SimpleTestCase):
    def test_normalize_phone(self):
        self.assertEqual(whatsapp.normalize_phone("(11) 99999-8888"), "5511999998888")
        self.assertEqual(whatsapp.normalize_phone("11 3333-4444"), "551133334444")
        self.assertEqual(whatsapp.normalize_phone("+55 11 99999-8888"), "5511999998888")
        self.assertEqual(whatsapp.normalize_phone("+1 415 555 2671"), "14155552671")
        for invalid in ("99999-8888", "+55 99999-8888"):
            with self.assertRaises(ValueError):
                whatsapp.normalize_phone(invalid)
