from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('events_page/', events_page, name='events_page'),
    path('add_event_page/', add_event_page, name='add_event_page'),
    path('add_event/', add_event, name='add_event'),
    path('event_page_data/', event_page_data, name='event_page_data'),
    path('all_events/', all_events, name='all_events'),
    path('event_details/', event_details_page, name='event_details_page'),
    path('event_details_data/', event_details_data, name='event_details_data'),
    path('edit_event_page/', edit_event_page, name='edit_event_page'),  
     path('get_event_details/<int:event_id>/', get_event_details, name='get_event_details'),  # Define this URL
    path('update_event/<int:event_id>/', update_event, name='update_event'),
    path('delete_media/<int:media_id>/', delete_media, name='delete_media'),
    path('delete_event/<int:event_id>/', delete_event, name='delete_event'),
  
]

# Only serve static and media files during development (when DEBUG = True)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
