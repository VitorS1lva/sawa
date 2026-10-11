from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView, TokenRefreshView

from config.tracing import get_logger

from .models import PhoneVerification, User
from .serializers import (
    LoginSerializer,
    RefreshSerializer,
    ResendCodeSerializer,
    SignupSerializer,
    UserSerializer,
    VerifyCodeSerializer,
)
from .verification import RESEND_COOLDOWN, CodeStatus, check_code, issue_code, seconds_until_resend
from .whatsapp import mask_phone

logger = get_logger(__name__)


def error(code: str, detail: str, http_status=status.HTTP_400_BAD_REQUEST) -> Response:
    """Erro do fluxo de autenticação: `code` é estável (para o front-end), `detail` é a mensagem."""
    # stacklevel=2: o log aponta para a view que chamou, não para esta função.
    logger.warning("Recusado com code=%s: %s", code, detail, stacklevel=2)
    return Response({"code": code, "detail": detail}, status=http_status)


def tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    logger.debug("Tokens JWT emitidos para o usuário %s (access 15 min, refresh 7 dias)", user.pk, stacklevel=2)
    return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}


class SignupView(APIView):
    """
    POST /api/auth/cadastro/ — cria a conta (ainda não confirmada) e envia o código pelo WhatsApp.
    Se o e-mail já tem cadastro pendente, atualiza os dados e reenvia o código.
    """

    permission_classes = [AllowAny]
    throttle_scope = "auth_signup"

    @transaction.atomic
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        name, email, phone, password = (
            serializer.validated_data[key] for key in ("name", "email", "phone", "password")
        )
        logger.info("Cadastro recebido para %s, WhatsApp %s", email, mask_phone(phone))

        user = User.objects.select_for_update().filter(email=email).first()
        if user and user.is_phone_verified:
            return error("email_taken", "Já existe uma conta com este e-mail. Tente entrar.")

        # O número pode estar preso a outro cadastro.
        holder = User.objects.select_for_update().filter(phone=phone).exclude(pk=getattr(user, "pk", None)).first()
        if holder and holder.is_phone_verified:
            return error("phone_taken", "Este WhatsApp já está em uso por outra conta.")
        if holder:
            # Cadastro pendente de outra pessoa (ou digitado errado): libera o número, para ninguém "reservar"
            # o WhatsApp de terceiros sem confirmar.
            logger.info("WhatsApp estava num cadastro pendente de outra conta; número liberado")
            holder.phone = None
            holder.save(update_fields=["phone"])
            PhoneVerification.objects.filter(user=holder).delete()

        phone_changed = user is not None and user.phone != phone
        if user is None:
            user = User.objects.create_user(email=email, name=name, password=password, phone=phone)
            logger.info("Usuário %s criado, aguardando confirmação do WhatsApp", user.pk)
        else:
            user.name, user.phone = name, phone
            user.set_password(password)
            user.save(update_fields=["name", "phone", "password"])
            logger.info("Cadastro pendente do usuário %s atualizado (número trocado: %s)", user.pk, phone_changed)

        # Número novo recebe código na hora; o mesmo número respeita o intervalo de reenvio.
        if phone_changed or seconds_until_resend(user) == 0:
            issue_code(user)
        else:
            logger.debug("Código anterior ainda vale; reenvio liberado em %ss", seconds_until_resend(user))

        return Response(
            {"email": user.email, "phone": mask_phone(phone), "resend_available_in": seconds_until_resend(user)},
            status=status.HTTP_201_CREATED,
        )


class VerifyCodeView(APIView):
    """POST /api/auth/verificar-codigo/ — confere o código; se certo, confirma o WhatsApp e já devolve os tokens."""

    permission_classes = [AllowAny]
    throttle_scope = "auth_verify"

    messages = {
        CodeStatus.INVALID: "Código incorreto.",
        CodeStatus.EXPIRED: "Este código expirou. Peça um novo.",
        CodeStatus.TOO_MANY_ATTEMPTS: "Muitas tentativas erradas. Peça um novo código.",
        CodeStatus.NOT_FOUND: "Código incorreto.",
    }

    def post(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email, code = serializer.validated_data["email"], serializer.validated_data["code"]
        logger.info("Conferindo código de confirmação de %s", email)

        user = User.objects.filter(email=email).first()
        # E-mail inexistente responde igual a código errado, para não revelar quem tem cadastro.
        if user is None:
            return error(CodeStatus.INVALID.value, self.messages[CodeStatus.INVALID])
        if user.is_phone_verified:
            return error("already_verified", "Este cadastro já foi confirmado. Faça login.")

        result = check_code(user, code)
        if result is not CodeStatus.VALID:
            # "not_found" vira "invalid" pelo mesmo motivo acima.
            code_name = CodeStatus.INVALID.value if result is CodeStatus.NOT_FOUND else result.value
            return error(code_name, self.messages[result])

        user.refresh_from_db()
        logger.info("WhatsApp do usuário %s confirmado; cadastro concluído e sessão iniciada", user.pk)
        return Response(tokens_for(user))


class ResendCodeView(APIView):
    """
    POST /api/auth/reenviar-codigo/ — envia um código novo, no máximo um por minuto.
    Responde sempre igual, exista ou não o cadastro, para não revelar quem tem conta.
    """

    permission_classes = [AllowAny]
    throttle_scope = "auth_resend"

    def post(self, request):
        serializer = ResendCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        logger.info("Pedido de reenvio do código para %s", email)
        user = User.objects.filter(email=email).first()
        if user and user.phone and not user.is_phone_verified and seconds_until_resend(user) == 0:
            with transaction.atomic():
                issue_code(user)
        else:
            # A resposta é a mesma de qualquer jeito, para não revelar quem tem conta.
            logger.debug("Nenhum código enviado (sem cadastro pendente ou dentro do intervalo de 60 s)")

        return Response(
            {
                "detail": "Se houver um cadastro pendente com este e-mail, enviamos um novo código.",
                "resend_available_in": int(RESEND_COOLDOWN.total_seconds()),
            }
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — e-mail e senha; devolve access, refresh e os dados do usuário."""

    serializer_class = LoginSerializer
    throttle_scope = "auth_login"


class RefreshView(TokenRefreshView):
    """POST /api/auth/token/renovar/ — troca o refresh por um access novo (e um refresh novo)."""

    serializer_class = RefreshSerializer


class LogoutView(TokenBlacklistView):
    """POST /api/auth/sair/ — invalida o refresh token; o access expira sozinho em até 15 minutos."""

    def post(self, request, *args, **kwargs):
        logger.info("Logout: refresh token vai para a lista de bloqueio")
        return super().post(request, *args, **kwargs)


class MeView(APIView):
    """GET /api/auth/eu/ — dados do usuário logado. DELETE — exclui a conta e todos os dados dela."""

    def get(self, request):
        logger.debug("Dados do usuário %s consultados", request.user.pk)
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        logger.info("Excluindo a conta do usuário %s e todos os dados dela", request.user.pk)
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
