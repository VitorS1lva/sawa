from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """A confirmação do cadastro passou do e-mail para o WhatsApp."""

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="phone",
            field=models.CharField(blank=True, max_length=15, null=True, unique=True, verbose_name="WhatsApp"),
        ),
        migrations.RenameField(model_name="user", old_name="email_verified_at", new_name="phone_verified_at"),
        migrations.AlterField(
            model_name="user",
            name="phone_verified_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="WhatsApp confirmado em"),
        ),
        migrations.RenameModel(old_name="EmailVerification", new_name="PhoneVerification"),
        migrations.AlterField(
            model_name="phoneverification",
            name="user",
            field=models.OneToOneField(
                on_delete=models.deletion.CASCADE,
                related_name="phone_verification",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
