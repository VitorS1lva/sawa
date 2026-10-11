from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


def normalize_email(email: str) -> str:
    """E-mails são comparados sem diferenciar maiúsculas: "Ana@X.com" e "ana@x.com" são a mesma conta."""
    return email.strip().lower()


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError("O e-mail é obrigatório.")
        user = self.model(email=normalize_email(email), name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        # Administradores criados pelo terminal não passam pela confirmação por WhatsApp.
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("phone_verified_at", timezone.now())
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Usuário da plataforma. Entra com e-mail e senha, depois de confirmar o WhatsApp com um código."""

    email = models.EmailField("e-mail", unique=True)
    name = models.CharField("nome", max_length=150)
    # Só dígitos, com DDI e DDD (ex.: 5511999999999). Vazio só em administradores criados pelo terminal.
    phone = models.CharField("WhatsApp", max_length=15, unique=True, null=True, blank=True)
    is_active = models.BooleanField("ativo", default=True)
    is_staff = models.BooleanField("equipe", default=False)
    date_joined = models.DateTimeField("cadastrado em", default=timezone.now)
    # Vazio enquanto o usuário não digitar o código enviado pelo WhatsApp.
    phone_verified_at = models.DateTimeField("WhatsApp confirmado em", null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "usuário"
        verbose_name_plural = "usuários"

    def __str__(self):
        return self.email

    @property
    def is_phone_verified(self) -> bool:
        return self.phone_verified_at is not None


class PhoneVerification(models.Model):
    """Código de 6 dígitos pendente de um usuário. Só existe um por vez; um novo substitui o anterior."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="phone_verification")
    # Só o hash do código fica no banco.
    code_hash = models.CharField(max_length=64)
    sent_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "código de confirmação"
        verbose_name_plural = "códigos de confirmação"

    def __str__(self):
        return f"Código de {self.user}"
