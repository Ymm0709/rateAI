# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0003_user_auth_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='last_login',
            field=models.DateTimeField(blank=True, null=True, verbose_name='最后登录时间'),
        ),
    ]

