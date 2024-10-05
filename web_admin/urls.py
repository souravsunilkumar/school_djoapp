from django.contrib import admin
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings



urlpatterns = [
    path('web_admin_dashboard/', web_admin_dashboard, name='web_admin_dashboard'),
    
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)