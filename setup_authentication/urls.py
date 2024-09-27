from django.contrib import admin
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings



urlpatterns = [
    
    path('register/', register_page, name='register_page'),
    path('api/register/', register_school, name='register_school'),
    path('login/', login_page, name='login_page'),  
    path('api/login/', user_login, name='user_login'),
    path('admin_dashboard/', admin_dashboard, name='admin_dashboard'),
    path('sub_admin_dashboard/', sub_admin_dashboard, name='sub_admin_dashboard'),
    path('api/admin_dashboard/', admin_dashboard_data, name='admin_dashboard_data'),
    path('api/register_sub_admin/', register_sub_admin, name='register_sub_admin'),
    path('api/register_employee/', register_employee, name='register_employee'),

    path('parent_register/', parent_register, name='parent_register'),
    path('get_schools/', get_schools, name='get_schools'),
    path('get_classes_and_divisions/<int:school_id>/', get_classes_and_divisions, name='get_classes_and_divisions'),
    path('get_students/<int:school_id>/<str:class_division>/', get_students, name='get_students'),
    path('register_parent/', register_parent, name='register_parent'),

    
    
    
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)