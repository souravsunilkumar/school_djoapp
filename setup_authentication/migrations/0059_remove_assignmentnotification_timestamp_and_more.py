# Generated by Django 5.1 on 2024-10-09 05:17

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0058_assignmentnotification_timestamp_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='assignmentnotification',
            name='timestamp',
        ),
        migrations.RemoveField(
            model_name='eventnotification',
            name='timestamp',
        ),
    ]
