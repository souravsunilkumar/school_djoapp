# Generated by Django 5.1 on 2024-09-24 10:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0052_eventnotification'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventbanner',
            name='school',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='setup_authentication.school'),
        ),
    ]
