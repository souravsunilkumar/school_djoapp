from django.db import models

# Create your models here.
class School(models.Model):
    school_name = models.CharField(max_length=255)
    address = models.TextField()
    contact = models.CharField(max_length=15)
    school_admin_first_name = models.CharField(max_length=255, null=True)
    school_admin_last_name = models.CharField(max_length=255, null=True)
    school_admin_username = models.CharField(max_length=255, null=True)  # New field

    def __str__(self):
        return self.school_name