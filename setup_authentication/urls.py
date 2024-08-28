from django.contrib import admin
from django.urls import path
from .views import *



urlpatterns = [
        path('',home,name='auth_home'),
        path('/admin_login',admin_login,name='admin_login'),
        path('/employee_login',employee_login,name='employee_login'),
        path('render_demo',render_demo,name='render_demo')
]

