from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('events_page/', events_page, name='events_page'),
    path('add_event_page/', add_event_page, name='add_event_page'),
    path('add_event/', add_event, name='add_event'),
    path('event_page_data/', event_page_data, name='event_page_data'),
    path('event_details/', event_details_page, name='event_details_page'),
    path('event_details_data/', event_details_data, name='event_details_data'),
  
]

# Only serve static and media files during development (when DEBUG = True)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
