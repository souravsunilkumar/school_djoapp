# Generated by Django 5.1 on 2024-09-19 09:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('setup_authentication', '0036_assignmentnotification_school_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assignment',
            name='subject',
            field=models.CharField(max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name='assignmentnotification',
            name='subject',
            field=models.CharField(max_length=10, null=True),
        ),
    ]
