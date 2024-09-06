# Generated by Django 5.1 on 2024-09-05 07:31

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0018_notification_teacher'),
    ]

    operations = [
        migrations.CreateModel(
            name='Leave_Reason',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('leave_date', models.DateField()),
                ('reason', models.TextField()),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='setup_authentication.parent')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='setup_authentication.student')),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='setup_authentication.teacher')),
            ],
        ),
    ]
