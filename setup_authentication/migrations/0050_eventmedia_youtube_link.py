# Generated by Django 5.1 on 2024-09-24 07:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0049_alter_eventmedia_media_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventmedia',
            name='youtube_link',
            field=models.URLField(blank=True, null=True),
        ),
    ]
