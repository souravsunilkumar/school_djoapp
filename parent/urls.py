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
    
    
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)