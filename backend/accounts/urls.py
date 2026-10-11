from django.urls import path

from . import views

urlpatterns = [
    path("cadastro/", views.SignupView.as_view(), name="signup"),
    path("verificar-codigo/", views.VerifyCodeView.as_view(), name="verify-code"),
    path("reenviar-codigo/", views.ResendCodeView.as_view(), name="resend-code"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/renovar/", views.RefreshView.as_view(), name="token-refresh"),
    path("sair/", views.LogoutView.as_view(), name="logout"),
    path("eu/", views.MeView.as_view(), name="me"),
]
