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
    path('notifications/read/<int:notification_id>/', mark_notification_as_read, name='mark_notification_as_read'),
    path('unread_notifications_count/', unread_notifications_count, name='unread_notifications_count'),
    path('absent_notifications/', absent_notifications, name='absent_notifications'),
    path('submit_leave_reason/', submit_leave_reason, name='submit_leave_reason'),
    path('check_reason_given/', check_reason_given, name='check_reason_given'),

    path('view_student_marks_page/', view_student_marks_page, name='view_student_marks_page'),
    path('get_academic_years/', get_academic_years, name='get_academic_years'),
    path('get_students_for_parent/', get_students_for_parent, name='get_students_for_parent'),
    path('get_student_marks/', get_student_marks, name='get_student_marks'),
    path('get_student_progress/', get_student_progress, name='get_student_progress'),
    path('absent_page/', absent_page, name='absent_page'),
    path('assignment_page/', assignment_page, name='assignment_page'),
    path('parent_assignment_notifications/', parent_assignment_notifications, name='assignment_notifications'),
    path('assignment_details/<int:assignment_id>/', assignment_details, name='assignment_details'),

    path('add_student_page/', add_student_page, name='add_student_page'),
    path('get_schools/', get_schools, name='get_schools'),
    path('get_classes_and_divisions/<int:school_id>/', get_classes_and_divisions, name='get_classes_and_divisions'),
    path('get_students/<int:school_id>/<str:class_division>/', get_students, name='get_students'),
    path('link_student/', link_student, name='link_student'),
    path('parent_event_page/', parent_event_page, name='parent_event_page'),
    path('get_event_banners/', get_event_banners, name='get_event_banners'),

    path('parent_event_details_page/', parent_event_details_page, name='get_event_banners'),
    path('get_event_details/<int:event_id>/', get_event_details, name='get_event_details'),

    path('timetables_page/', timetables_page, name='timetables_page'),
    path('get_exam_timetables/', get_exam_timetables, name='get_exam_timetables'),
    path('get_exam_details/', get_exam_details, name='get_exam_details'),



    
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)