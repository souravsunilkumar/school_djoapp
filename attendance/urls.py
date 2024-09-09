from django.contrib import admin
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('mark_student_attendance/', mark_student_attendance_page, name='mark_student_attendance_page'),
    path('api/get_students/', get_students, name='get_students'),
    path('api/mark_student_attendance/', mark_student_attendance, name='mark_student_attendance'),
    path('view_attendance_report/', view_attendance_report_page, name='view_attendance_report_page'),
    path('api/view_attendance_report/', view_attendance_report, name='view_attendance_report'),
    path('attendance_report_pdf/', attendance_report_pdf_page, name='attendance_report_pdf_page'),

    path('individual_student_attendance/', individual_student_attendance_page, name='individual_student_attendance_page'),
    path('api/get_student_attendance/', get_student_attendance, name='get_student_attendance'),
    path('api/get_class_students/', get_class_students, name='get_students'),
        
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)