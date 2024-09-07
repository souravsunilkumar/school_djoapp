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
    
    
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)