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
    path('api/delete_student/', delete_student, name='delete_student'),
    path('notifications/', get_teacher_notifications, name='get_teacher_notifications'),

    path('add_students_marks/', add_students_marks ,name='add_students_marks'),
    path('add_exam/', add_exam, name='add_exam'),
    path('get_academic_years/', get_academic_years, name='get_academic_years'),
    path('get_exams/', get_exams, name='get_exams'),
    path('get_classes_and_divisions/', get_classes_and_divisions, name='get_classes_and_divisions'),
    path('add_subject/', add_subject, name='add_subject'),


    path('add_marks_page/', add_marks_page, name='add_marks_page'),
    path('get_subject/', get_subject, name='get_subject'),
    path('get_students/', get_students, name='get_students'),
    path('add_marks/', add_marks, name='add_marks'),


    path('view_student_marks_page/', view_student_marks_page, name='view_student_marks_page'),
    path('view_student_marks/', view_student_marks, name='view_student_marks'),
    path('view_individual_student_marks/', view_individual_student_marks, name='view_student_marks'),
    path('get_students_by_class_teacher/', get_students_by_class_teacher, name='get_students_by_class_teacher'),
    path('get_student_marks/', get_student_marks, name='get_student_marks'),
    path('check_existing_marks/', check_existing_marks, name='check_existing_marks'),
    path('get_existing_marks/', get_existing_marks, name='get_existing_marks'),
    path('update_marks_page/', update_marks_page, name='update_marks_page'),
    path('update_marks/', update_marks, name='add_or_update_marks'),

    path('leave_reason_page/', leave_reason_page, name='leave_reason_page'),

    path('add_assignment_page/', add_assignment_page, name='add_assignment_page'),
    path('add_assignment/', add_assignment, name='add_assignment'),

]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
