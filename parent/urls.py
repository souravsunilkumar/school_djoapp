from django.contrib import admin
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings



urlpatterns = [
    path('parent_dashboard/', parent_dashboard_page, name='parent_dashboard'),
    path('parent_dashboard_data/', parent_dashboard, name='parent_dashboard_data'),
    path('attendance_report/', attendance_report, name='attendance_report'),
    path('notifications/', parent_notifications, name='parent_notifications'),
    path('mark_notifications_as_read/', mark_notifications_as_read, name='mark_notifications_as_read'),
    path('submit_leave_reason/', submit_leave_reason, name='submit_leave_reason'),
    path('check_reason_given/', check_reason_given, name='check_reason_given'),

    path('view_student_marks_page/', view_student_marks_page, name='view_student_marks_page'),
    path('get_academic_years/', get_academic_years, name='get_academic_years'),
    path('get_students_for_parent/', get_students_for_parent, name='get_students_for_parent'),
    path('get_student_marks/', get_student_marks, name='get_student_marks'),
    path('get_student_progress/', get_student_progress, name='get_student_progress'),
    path('absent_page/', absent_page, name='absent_page'),
    
    
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)