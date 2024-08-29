from django.contrib import admin
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings



urlpatterns = [
    path('', home, name='auth_home'),
    path('register/', register_page, name='register_page'),
    path('api/register/', register_school, name='register_school'),
    path('login/', login_page, name='login_page'),  
    path('api/login/', login_admin, name='login_admin'),
    path('admin_dashboard/', admin_dashboard, name='admin_dashboard'),
    path('api/admin_dashboard/', admin_dashboard_data, name='admin_dashboard_data'),
    path('api/register_sub_admin/', register_sub_admin, name='register_sub_admin'),
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)