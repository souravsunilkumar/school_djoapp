from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('api/get_teachers/', get_teachers, name='get_teachers'),
    path('assign_class_teacher/', assign_class_teacher, name='assign_class_teacher'),
    path('api/assign_class_teacher/', assign_class_teacher, name='assign_class_teacher'),
    path('admin_assign_class_teacher/', admin_assign_class_teacher, name='admin_assign_class_teacher'),
    path('api/get_wardens/', get_wardens, name='get_wardens'),
    path('add_students/', add_students_view, name='add_students_view'),
    path('api/add_student/', add_student, name='add_student'),

]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
