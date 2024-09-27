from django.contrib import admin
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings



urlpatterns = [
    path('school_management/',school_management,name="school_management"),
    path('manage_teachers_page/',manage_teachers_page,name="manage_teachers_page"),
    path('get_teachers/', get_teachers, name='get_teachers'),
    path('delete_teacher/<int:teacher_id>/', delete_teacher, name='delete_teacher'),
    path('edit_teacher_page/<int:teacher_id>/', edit_teacher_page, name='edit_teacher_page'),
    path('edit_teacher/', edit_teacher, name='edit_teacher'),
    path('manage_student_page/', manage_student_page, name='manage_student_page'),

    path('get_classes_and_divisions/', get_classes_and_divisions, name='get_classes_and_divisions'),
    path('get_students/', get_students, name='get_students'),

    path('admin_student_attendance_page/', admin_student_attendance_page, name='admin_student_attendance_page'),
    path('get_student_attendance/', get_student_attendance, name='get_student_attendance'),

    path('admin_view_marks_page/<int:student_id>/', admin_view_marks_page, name='admin_view_marks_page'),
    path('get_student_marks/', get_student_marks, name='get_student_marks'),

    path('admin_class_attendance_page/', admin_class_attendance_page, name='admin_class_attendance_page'),
    path('api/get-classes-divisions/', get_classes_divisions, name='get_classes_divisions'),
    path('api/get-divisions/', get_divisions, name='get_divisions'),
    path('api/get-attendance/', get_attendance, name='get_attendance'),

    path('admin_marks_page', admin_marks_page, name='admin_marks_page'),
    path('api/get-academic-years/', get_academic_years, name='get_academic_years'),
    path('api/get-student-marks/', get_student_marks, name='get_student_marks'),


]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)