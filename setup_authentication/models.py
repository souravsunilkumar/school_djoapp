from django.db import models

# Create your models here.
class School(models.Model):
    school_id = models.AutoField(primary_key=True)
    school_name = models.CharField(max_length=255)
    school_address = models.TextField()
    contact_number= models.CharField(max_length=15)
    contact_email=models.CharField(max_length=50)
    school_admin_first_name = models.CharField(max_length=255, null=True)
    school_admin_last_name = models.CharField(max_length=255, null=True)
    school_admin_username = models.CharField(max_length=255, null=True)



    def __str__(self):
        return self.school_name


class School_admin(models.Model):
    school_admin_id= models.AutoField(primary_key=True)


    def __str__(self):
        return self.School_admin
    
    