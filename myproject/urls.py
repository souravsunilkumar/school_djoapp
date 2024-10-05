"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from setup_authentication.views import *


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='auth_home'),
    path('attendance/', include('attendance.urls')),
    path('setup_auth/', include('setup_authentication.urls')),
    path('progress/', include('student_progress.urls')),
    path('management/', include('management.urls')),
    path('parent/', include('parent.urls')),
    path('events/', include('events.urls')),
    path('web_admin/', include('web_admin.urls')),
    path('admin_management/', include('admin_management.urls')),
]

# Only serve static and media files during development (when DEBUG = True)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
