from django.contrib import admin
from .models import *
# Register your models here.

class EventMediaInline(admin.TabularInline):  # Use TabularInline for a better layout
    model = EventMedia
    extra = 1  # Number of empty forms to display

class EventBannerInline(admin.TabularInline):
    model = EventBanner
    extra = 1  # Number of empty forms to display

class EventAdmin(admin.ModelAdmin):
    inlines = [EventMediaInline, EventBannerInline]  # Include both inlines here
    list_display = ('title', 'event_date', 'school')  # Customize display fields


    
admin.site.register(School)
admin.site.register(School_admin)
admin.site.register(Employee)
admin.site.register(Teacher)
admin.site.register(Warden)
admin.site.register(Class_Teacher)
admin.site.register(Student)
admin.site.register(Attendance)
admin.site.register(Parent)
admin.site.register(Notification)
admin.site.register(TeacherNotification)
admin.site.register(LeaveReason)
admin.site.register(Exam)
admin.site.register(Subject)
admin.site.register(Marks)
admin.site.register(Assignment)
admin.site.register(AssignmentNotification)
admin.site.register(StudentAssignmentSubmission)
admin.site.register(Event,EventAdmin)
admin.site.register(EventMedia)
admin.site.register(EventBanner)
admin.site.register(EventNotification)
admin.site.register(ExamTimetable)
admin.site.register(TimetableNotification)