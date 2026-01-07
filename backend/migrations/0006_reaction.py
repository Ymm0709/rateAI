# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0005_rating_overall_score_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Reaction',
            fields=[
                ('reaction_id', models.AutoField(primary_key=True, serialize=False)),
                ('reaction_type', models.CharField(choices=[('thumbUp', '点赞'), ('thumbDown', '点踩'), ('amazing', '惊叹'), ('bad', '差评')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ai', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='backend.aimodel')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='backend.user')),
            ],
        ),
        migrations.AddIndex(
            model_name='reaction',
            index=models.Index(fields=['ai', 'reaction_type'], name='backend_re_ai_id_abc123_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='reaction',
            unique_together={('user', 'ai', 'reaction_type')},
        ),
    ]

