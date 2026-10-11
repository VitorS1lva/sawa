from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import exceptions, serializers
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

from config.tracing import get_logger

from .models import User, normalize_email
from .verification import CODE_LENGTH, issue_code, seconds_until_resend
from .whatsapp import mask_phone, normalize_phone

logger = get_logger(__name__)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "phone", "date_joined"]
        read_only_fields = fields


class EmailField(serializers.EmailField):
    """E-mail já normalizado (sem espaços, minúsculo)."""

    def to_internal_value(self, data):
        return normalize_email(super().to_internal_value(data))


class PhoneField(serializers.CharField):
    """WhatsApp com DDD; vira só dígitos com DDI (ex.: "(11) 99999-9999" → "5511999999999")."""

    def to_internal_value(self, data):
        try:
            return normalize_phone(super().to_internal_value(data))
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, trim_whitespace=True)
    email = EmailField()
    phone = PhoneField(max_length=30)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        # Valida a senha com as regras do settings (tamanho mínimo, senhas comuns, parecida com o e-mail...).
        candidate = User(email=attrs["email"], name=attrs["name"])
        try:
            password_validation.validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)}) from error
        return attrs


class VerifyCodeSerializer(serializers.Serializer):
    email = EmailField()
    code = serializers.RegexField(rf"^\d{{{CODE_LENGTH}}}$", error_messages={"invalid": "O código tem 6 dígitos."})


class ResendCodeSerializer(serializers.Serializer):
    email = EmailField()


class PhoneNotVerified(exceptions.PermissionDenied):
    default_detail = "Confirme seu WhatsApp com o código que enviamos antes de entrar."
    default_code = "phone_not_verified"


def login_error(code: str, field: str, message: str) -> exceptions.AuthenticationFailed:
    """Erro de login com `code` estável e a mensagem no campo do formulário (`email` ou `password`)."""
    return exceptions.AuthenticationFailed({"code": code, "detail": message, field: [message]})


class LoginSerializer(TokenObtainPairSerializer):
    """
    Login com e-mail e senha. Diz qual dos dois está errado e bloqueia quem ainda não confirmou o WhatsApp.

    Dizer "não há conta com este e-mail" revela quem tem cadastro (o cadastro já revela, com `email_taken`);
    o limite de 10 tentativas por minuto por IP reduz o uso disso para varrer e-mails.
    """

    # O SimpleJWT não traduz esta mensagem (conta desativada).
    default_error_messages = {"no_active_account": "E-mail ou senha incorretos."}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Valida o formato do e-mail (o SimpleJWT aceita qualquer texto) e já normaliza.
        self.fields[self.username_field] = EmailField(
            write_only=True, error_messages={"invalid": "Este e-mail não é válido. Confira se digitou certo."}
        )

    def validate(self, attrs):
        email, password = attrs[self.username_field], attrs["password"]
        logger.info("Tentativa de login de %s", email)

        user = User.objects.filter(email=email).first()
        if user is None:
            logger.debug("Nenhuma conta com este e-mail")
            raise login_error("account_not_found", "email", "Não encontramos uma conta com este e-mail.")
        if not user.check_password(password):
            logger.debug("Conta encontrada (usuário %s), mas a senha não confere", user.pk)
            raise login_error("wrong_password", "password", "Senha incorreta.")

        # E-mail e senha certos: o SimpleJWT autentica de novo e confere se a conta está ativa.
        data = super().validate(attrs)

        if not self.user.is_phone_verified:
            # A senha está certa, mas falta confirmar o WhatsApp: manda um código novo, se já puder.
            logger.warning("Senha correta, mas o WhatsApp do usuário %s não foi confirmado", self.user.pk)
            if seconds_until_resend(self.user) == 0:
                issue_code(self.user)
            raise PhoneNotVerified(
                {
                    "detail": PhoneNotVerified.default_detail,
                    "code": PhoneNotVerified.default_code,
                    "phone": mask_phone(self.user.phone) if self.user.phone else None,
                }
            )

        data["user"] = UserSerializer(self.user).data
        logger.info("Login do usuário %s aceito; tokens JWT emitidos", self.user.pk)
        return data


class RefreshSerializer(TokenRefreshSerializer):
    """Renovação de token. Se a conta foi excluída, o token é inválido (401), e não um erro 500."""

    def validate(self, attrs):
        logger.debug("Renovando a sessão: refresh token trocado por um par novo (rotação)")
        try:
            return super().validate(attrs)
        except User.DoesNotExist as error:
            raise InvalidToken("Esta conta não existe mais.") from error
