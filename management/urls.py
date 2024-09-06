from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('api/get_teachers/', get_teachers, name='get_teachers'),
    path('teacher_dashboard/', teacher_dashboard, name='teacher_dashboard'),
    path('api/teacher/dashboard/', teacher_dashboard_data, name='teacher_dashboard_data'),
    path('assign_class_teacher/', assign_class_teacher, name='assign_class_teacher'),
    path('api/assign_class_teacher/', assign_class_teacher, name='assign_class_teacher'),
    path('admin_assign_class_teacher/', admin_assign_class_teacher, name='admin_assign_class_teacher'),
    path('api/get_wardens/', get_wardens, name='get_wardens'),
    path('add_students/', add_students_view, name='add_students_view'),
    path('api/add_student/', add_student, name='add_student'),
    path('api/get_student/<int:student_id>/', get_student, name='get_student'),
    path('edit_student/<int:student_id>/', edit_student_page, name='edit_student_page'),
    path('api/edit_student/<int:student_id>/', edit_student, name='edit_student'),

]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
