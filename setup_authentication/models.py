from django.db import models
from django.contrib.auth.models import Group
from django.contrib.auth.models import User
from datetime import date



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
    
class Employee(models.Model):
    TEACHER = 'Teacher'
    PEON = 'Peon'
    SECURITY = 'Security'
    WARDEN = 'Warden'
    OFFICE_STAFF = 'Office Staff'

    DESIGNATION_CHOICES = [
        (TEACHER, 'Teacher'),
        (PEON, 'Peon'),
        (SECURITY, 'Security'),
        (WARDEN, 'Warden'),
        (OFFICE_STAFF, 'Office Staff'),
    ]

    id = models.AutoField(primary_key=True)  # Explicit id field
    school = models.ForeignKey(School, on_delete=models.CASCADE)  # Foreign key to School model
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Foreign key to User model
    user_name=models.CharField(max_length=25, null=True)
    first_name = models.CharField(max_length=25)
    second_name = models.CharField(max_length=25)
    contact_number = models.CharField(max_length=15)
    designation = models.CharField(
        max_length=20,
        choices=DESIGNATION_CHOICES,
        default=TEACHER,
    )

    def __str__(self):
        return f"{self.first_name} {self.second_name} - {self.designation} - {self.school}"
    

class Teacher(models.Model):
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    user = models.OneToOneField(User, on_delete=models.CASCADE,null=True)  # Link to User model
    user_name = models.CharField(max_length=25, null=True)
    first_name = models.CharField(max_length=25)
    last_name = models.CharField(max_length=25)
    contact_number = models.CharField(max_length=15, null=True)
    is_class_teacher = models.BooleanField(default=False)  # New field

    def __str__(self):
        return f"{self.first_name} {self.last_name} - Teacher - {self.school}"
    

class Class_Teacher(models.Model):
    id = models.AutoField(primary_key=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, null=True)  # Ensure lowercase 'teacher'
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)  # Link to User model
    user_name = models.CharField(max_length=25, null=True)
    first_name = models.CharField(max_length=25)
    last_name = models.CharField(max_length=25)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    class_assigned = models.CharField(max_length=20)
    division_assigned = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.class_assigned} {self.division_assigned} - {self.school}"
    
class Warden(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit id field
    school = models.ForeignKey(School, on_delete=models.CASCADE)  # Link to School model
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)  # Link to Employee model
    user = models.OneToOneField(User, on_delete=models.CASCADE,null=True)  # Link to User model
    user_name = models.CharField(max_length=20, null=True)
    first_name = models.CharField(max_length=20)
    last_name = models.CharField(max_length=20)
    contact_number = models.CharField(max_length=15, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - Warden - {self.school}"
    


class Student(models.Model):
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    class_teacher = models.ForeignKey(Class_Teacher, on_delete=models.CASCADE, null=True)
    warden = models.ForeignKey(Warden, on_delete=models.SET_NULL, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=100, null=True)
    admission_number = models.CharField(max_length=20, null=True)
    roll_number = models.IntegerField(null=True)
    parents_number = models.CharField(max_length=15, null=True)
    parents_email = models.EmailField(max_length=40, null=True)
    class_assigned = models.CharField(max_length=20)
    division_assigned = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.roll_number} {self.first_name} {self.last_name} - {self.class_assigned} {self.division_assigned} - {self.school}"

    @property
    def class_and_division(self):
        return f"{self.class_assigned} - {self.division_assigned}"
    

class Attendance(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit id field
    student = models.ForeignKey(Student, on_delete=models.CASCADE,null=True)
    date = models.DateField(default=date.today)
    is_present = models.BooleanField(default=False)  

    def __str__(self):
        return f"{self.student} - {'Absent' if not self.is_present else 'Present'} on {self.date}"
    

class Parent(models.Model):
    first_name = models.CharField(max_length=255)
    second_name = models.CharField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE, blank=True, null=True)
    students = models.ManyToManyField(Student, blank=True)  
    contact_number = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return f"{self.first_name} {self.second_name} ({self.username})"


class Notification(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE,null=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    student_name = models.CharField(max_length=255, null=True, blank=True)
    absence_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Notification for {self.parent.username if self.parent else 'No Parent'} - {self.message[:20]}"
    

class Leave_Reason(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE)
    leave_date = models.DateField()
    reason = models.TextField()

    def __str__(self):
        return f"Leave Reason for {self.student.first_name} {self.student.last_name} on {self.leave_date}"