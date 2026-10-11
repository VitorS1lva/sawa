from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import PhoneVerification, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "name", "phone", "phone_verified_at", "is_staff", "date_joined"]
    list_filter = ["is_staff", "is_active"]
    search_fields = ["email", "name", "phone"]
    readonly_fields = ["date_joined", "last_login"]
    fieldsets = [
        (None, {"fields": ["email", "name", "phone", "password"]}),
        ("Confirmação", {"fields": ["phone_verified_at"]}),
        ("Permissões", {"fields": ["is_active", "is_staff", "is_superuser", "groups", "user_permissions"]}),
        ("Datas", {"fields": ["date_joined", "last_login"]}),
    ]
    add_fieldsets = [(None, {"classes": ["wide"], "fields": ["email", "name", "password1", "password2"]})]


@admin.register(PhoneVerification)
class PhoneVerificationAdmin(admin.ModelAdmin):
    # O código em si nunca aparece: só o hash fica salvo.
    list_display = ["user", "sent_at", "expires_at", "attempts"]
    readonly_fields = ["user", "code_hash", "sent_at", "expires_at", "attempts"]
