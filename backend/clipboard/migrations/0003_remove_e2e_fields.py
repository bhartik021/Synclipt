from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clipboard', '0002_add_delete_token'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clipboard',
            name='is_encrypted',
        ),
    ]
