# Generated by Django 5.1 on 2024-10-09 05:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0057_school_admin_school_admin_username'),
    ]

    operations = [
        migrations.AddField(
            model_name='assignmentnotification',
            name='timestamp',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='eventnotification',
            name='timestamp',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
