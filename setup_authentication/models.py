from django.db import models
from django.contrib.auth.models import Group

# Create your models here.
class School(models.Model):
    school_id = models.AutoField(primary_key=True)
    school_name = models.CharField(max_length=50)
    school_address = models.TextField()
    contact_number = models.CharField(max_length=15)
    contact_email = models.CharField(max_length=50)
    school_admin_username = models.CharField(max_length=15, null=True)
    school_admin_first_name = models.CharField(max_length=50, null=True)
    school_admin_last_name = models.CharField(max_length=50, null=True)

    def __str__(self):
        return self.school_name

class School_admin(models.Model):
    school_admin_id = models.AutoField(primary_key=True)
    school_admin_first_name = models.CharField(max_length=50, null=True)
    school_admin_last_name = models.CharField(max_length=50, null=True)
    school_admin_username = models.CharField(max_length=15, null=True)  # Added field
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return f"{self.school_admin_first_name} {self.school_admin_last_name}".strip()