# Generated by Django 5.1 on 2024-09-24 08:12

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0051_eventbanner'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventNotification',
            fields=[
                ('event_notification_id', models.AutoField(primary_key=True, serialize=False)),
                ('school_admin_username', models.CharField(max_length=15)),
                ('title', models.CharField(max_length=100)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='setup_authentication.event')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='setup_authentication.school')),
            ],
        ),
    ]
