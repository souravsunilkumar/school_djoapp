import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from setup_authentication.models import *
from django.views.decorators.http import require_GET, require_POST

logger = logging.getLogger(__name__)

# Create your views here.

def events_page(request): 
    return render(request,'events/event_page.html')

def add_event_page(request): 
    return render(request,'events/add_event_page.html')

def add_event(request):
    if request.method == 'POST':
        # Assuming the user is logged in and is a School_admin
        try:
            school_admin = School_admin.objects.get(school_admin_username=request.user.username)
            school = school_admin.school  # Get the school from the School_admin model
        except School_admin.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'School admin does not exist.'}, status=400)

        title = request.POST.get('title')
        description = request.POST.get('description')
        event_date = request.POST.get('event_date')
        feature_image = request.FILES.get('feature_image')
        youtube_link = request.POST.get('youtube_link')  # Get the YouTube link

        # Create the event
        event = Event.objects.create(
            school=school,
            school_admin_username=school_admin.school_admin_username,
            title=title,
            description=description,
            event_date=event_date,
            feature_image=feature_image,
        )

        # Handle event media
        media_files = request.FILES.getlist('media_files')
        for media_file in media_files:
            EventMedia.objects.create(event=event, media_file=media_file)

        # Create Event Banner
        EventBanner.objects.create(
            school=school,
            event=event,
            banner_title=event.title,
            banner_image=feature_image,
        )

        # Create Event Notification
        EventNotification.objects.create(
            school=school,
            school_admin_username=school_admin.school_admin_username,
            event=event,
            title=event.title,
        )

        return JsonResponse({'success': True})

    return JsonResponse({'success': False}, status=400)

def event_page_data(request):
    # Fetch the logged-in school admin and their school
    school_admin = School_admin.objects.get(school_admin_username=request.user.username)
    school = school_admin.school

    # Get event banners for the logged-in admin's school
    event_banners = EventBanner.objects.filter(school=school)

    # Prepare the data in JSON format
    banner_data = [
        {
            'event_id': banner.event.event_id,
            'banner_title': banner.banner_title,
            'banner_image_url': banner.banner_image.url if banner.banner_image else '',
        }
        for banner in event_banners
    ]

    return JsonResponse({'event_banners': banner_data})


def event_details_page(request):
    return render(request, 'events/event_details.html')


def event_details_data(request):
    event_id = request.GET.get('id')
    event = get_object_or_404(Event, event_id=event_id)
    
    # Get the associated media (YouTube links and images)
    event_media = EventMedia.objects.filter(event=event)
    
    media_data = {
        'youtube_links': [media.youtube_link for media in event_media if media.youtube_link],
        'images': [media.media_file.url for media in event_media if media.media_file],
    }
    
    event_data = {
        'title': event.title,
        'description': event.description,
        'event_date': event.event_date,
        'feature_image_url': event.feature_image.url if event.feature_image else '',
    }
    
    return JsonResponse({'event': event_data, 'media': media_data})