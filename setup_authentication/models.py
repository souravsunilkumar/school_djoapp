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
    TEACHER = "Teacher"
    WARDEN = "Warden"

    DESIGNATION_CHOICES = [
        (TEACHER, "Teacher"),
        (WARDEN, "Warden"),
        
    ]

    id = models.AutoField(primary_key=True)  # Explicit id field
    school = models.ForeignKey(School, on_delete=models.CASCADE)  # Foreign key to School model
    user = models.OneToOneField( User, on_delete=models.CASCADE)  # Foreign key to User model
    user_name = models.CharField(max_length=25, null=True)
    first_name = models.CharField(max_length=25)
    second_name = models.CharField(max_length=25)
    contact_number = models.CharField(max_length=15)
    designation = models.CharField(max_length=20,choices=DESIGNATION_CHOICES,default=TEACHER,)

    def __str__(self):
        return (
            f"{self.first_name} {self.second_name} - {self.designation} - {self.school}"
        )


class Teacher(models.Model):
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)  # Link to User model
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
    user = models.OneToOneField( User, on_delete=models.CASCADE, null=True)  # Link to User model
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
    user = models.OneToOneField( User, on_delete=models.CASCADE, null=True)  # Link to User model
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
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True)
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
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    student_name = models.CharField(max_length=255, null=True, blank=True)
    absence_date = models.DateField(null=True, blank=True)
    TYPE_CHOICES = (
        ('absent', 'Absent Notification'),
        ('assignment', 'Assignment Notification'),
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES,default='absent')
    

    def __str__(self):
        return f"Notification for {self.parent.username if self.parent else 'No Parent'} - {self.message[:20]}"


class LeaveReason(models.Model):
    student = models.ForeignKey("Student", on_delete=models.CASCADE)
    parent = models.ForeignKey("Parent", on_delete=models.CASCADE)
    teacher = models.ForeignKey("Teacher", on_delete=models.CASCADE, null=True, blank=True)
    parent_notification = models.ForeignKey("Notification", on_delete=models.CASCADE, null=True, blank=True)
    reason = models.TextField()
    date = models.DateField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Leave Reason for {self.student} on {self.date}"


class TeacherNotification(models.Model):
    teacher = models.ForeignKey("Teacher", on_delete=models.CASCADE)
    parent = models.ForeignKey("Parent", on_delete=models.CASCADE, null=True, blank=True)
    student = models.ForeignKey("Student", on_delete=models.CASCADE)
    message = models.TextField()
    reason = models.ForeignKey("LeaveReason", on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.student} - {self.message[:20]}"


class Exam(models.Model):
    exam_id = models.AutoField(primary_key=True)
    exam_name = models.CharField(max_length=100)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    school_admin_username = models.CharField(max_length=15, null=True)
    academic_year = models.CharField(max_length=15, null=True)

    def __str__(self):
        return f"{self.exam_name} - {self.academic_year} - ({self.school.school_name})"


class Subject(models.Model):
    subject_id = models.AutoField(primary_key=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    user_name = models.CharField(max_length=25)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    class_assigned = models.CharField(max_length=20)
    division_assigned = models.CharField(max_length=10)
    subject_name = models.CharField(max_length=25)

    def __str__(self):
        return (
            f"{self.subject_name} ({self.teacher.first_name} {self.teacher.last_name}) - {self.exam.academic_year}"
        )


class Marks(models.Model):
    marks_id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    class_assigned = models.CharField(max_length=20)
    division_assigned = models.CharField(max_length=10)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    marks_obtained = models.CharField(max_length=10, null=True, blank=True)
    out_of = models.CharField(max_length=10, null=True, blank=True)
    date_uploaded = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.subject} - {self.exam} - {self.marks_obtained}/{self.out_of}"


class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    subject = models.CharField(max_length=10, null=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    class_assigned = models.CharField(max_length=20)
    division_assigned = models.CharField(max_length=10)
    title = models.CharField(max_length=255)
    description = models.TextField()
    due_date = models.DateField()
    date_assigned = models.DateField(auto_now_add=True)
    academic_year = models.CharField(max_length=10,null=True) 
    def __str__(self):
        return f"{self.title} - {self.teacher} - {self.class_assigned} {self.division_assigned} - Due: {self.due_date}"
    
class AssignmentNotification(models.Model):
    notification_id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE,null=True)
    subject = models.CharField(max_length=10,null=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE,null=True)
    class_assigned = models.CharField(max_length=20)
    division_assigned = models.CharField(max_length=10)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    date_sent = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification from {self.teacher} - Assignment: {self.assignment.title}"
    

class StudentAssignmentSubmission(models.Model):
    submission_id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True)
    class_assigned = models.CharField(max_length=20, blank=True)
    division_assigned = models.CharField(max_length=10, blank=True)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, blank=True)
    is_submitted = models.BooleanField(default=False)
    submission_date = models.DateField(null=True, blank=True)  # Ensure this can be null
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"Submission by {self.student} for {self.assignment.title}"
    

class Event(models.Model):
    event_id = models.AutoField(primary_key=True)
    school = models.ForeignKey('School', on_delete=models.CASCADE)
    school_admin_username = models.CharField(max_length=15)
    title = models.CharField(max_length=100)
    description = models.TextField()
    event_date = models.DateField(null=True, blank=True)  # Date of the event
    feature_image = models.ImageField(upload_to='event_images/', null=True, blank=True)  # Feature image field

    def __str__(self):
        return self.title


class EventMedia(models.Model):
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='media')
    media_file = models.ImageField(upload_to='event_images/', null=True, blank=True)
    youtube_link = models.URLField(max_length=200, blank=True, null=True)  # Optional YouTube link

    def __str__(self):
        return f"Media for {self.event.title}"
    

class EventBanner(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE,null=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='banners')
    banner_title = models.CharField(max_length=100)  # Title of the banner
    banner_image = models.ImageField(upload_to='event_banners/', null=True, blank=True)  # Banner image field

    def __str__(self):
        return self.banner_title 
    

class EventNotification(models.Model):
    event_notification_id = models.AutoField(primary_key=True)
    school = models.ForeignKey('School', on_delete=models.CASCADE)  # ForeignKey to School
    school_admin_username = models.CharField(max_length=15)
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='notifications')  # ForeignKey to Event
    title = models.CharField(max_length=100)

    def __str__(self):
        return self.title