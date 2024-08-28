from django.db import models

# Create your models here.
class School(models.Model):
    school_id = models.AutoField(primary_key=True)
    school_name = models.CharField(max_length=255)
    school_address = models.TextField()
    contact_number= models.CharField(max_length=15)
    contact_email=models.CharField(max_length=50)
    school_main_admin_email = models.CharField(max_length=255,null=True)

    def __str__(self):
        return self.school_name

class School_admin(models.Model):
    school_admin_id= models.AutoField(primary_key=True)
    School_admin_name=models.CharField(max_length=255)
    school_id=models.ForeignKey(School,on_delete=models.CASCADE)
    admin_approval=models.BooleanField(default=False)
    
     
    def __str__(self):
        return self.School_admin_name
    

