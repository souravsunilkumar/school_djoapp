from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from rest_framework.response import Response
from .models import *
import json 
from .serializers import *
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

def home(request):
    return render(request,'index.html')

def register_page(request):
    return render(request, 'school_register.html')

@csrf_exempt
def register_school(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            password = data.get('password')
            if not password:
                return JsonResponse({'success': False, 'message': 'Password is required.'})

            # Extract data from JSON payload
            school_admin_first_name = data.get('school_admin_first_name')
            school_admin_last_name = data.get('school_admin_last_name')
            school_admin_username = data.get('school_admin_username')

            # Create the admin user and save first and last name
            user = User.objects.create_user(
                username=school_admin_username,
                password=password,
                first_name=school_admin_first_name,
                last_name=school_admin_last_name
            )

            # Add the user to the 'Main Administrator' group
            main_admin_group = Group.objects.get(id=1)
            user.groups.add(main_admin_group)

            # Create the school and save admin details in School model
            school = School.objects.create(
                school_name=data.get('school_name'),
                school_address=data.get('school_address'),
                contact_number=data.get('contact_number'),
                contact_email=data.get('contact_email'),
                school_admin_username=school_admin_username,
                school_admin_first_name=school_admin_first_name,
                school_admin_last_name=school_admin_last_name
            )

            # Create the school admin profile and save school relation
            school_admin = School_admin.objects.create(
                school_admin_first_name=school_admin_first_name,
                school_admin_last_name=school_admin_last_name,
                school_admin_username=school_admin_username,  # Save username here
                school=school
            )

            return JsonResponse({'success': True, 'message': 'School and Admin registered successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


def login_page(request):
    """Render the login page."""
    return render(request, 'login.html')

@csrf_exempt
def login_admin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                main_admin_group = Group.objects.get(id=1)
                if main_admin_group in user.groups.all():
                    # Redirect URL for the admin dashboard
                    return JsonResponse({'success': True, 'redirect_url': '/setup_auth/admin_dashboard/'})
                else:
                    return JsonResponse({'success': False, 'message': 'User is not authorized as Main Administrator.'})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

def admin_dashboard(request):
    return render(request, 'admin_dashboard.html')

@login_required
def admin_dashboard_data(request):
    try:
        # Fetch the current logged-in user
        user = request.user

        # Find the corresponding School_admin instance
        try:
            school_admin = School_admin.objects.get(school_admin_username=user.username)
            school = school_admin.school
            admin_name = f"{school_admin.school_admin_first_name} {school_admin.school_admin_last_name}"
            school_name = school.school_name
        except School_admin.DoesNotExist:
            admin_name = "Unknown"
            school_name = "Unknown"

        return JsonResponse({
            'success': True,
            'data': {
                'admin_name': admin_name,
                'school_name': school_name
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})
    

@csrf_exempt
def register_sub_admin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Extract the data from the request
            username = data.get('sub_admin_username')
            first_name = data.get('sub_admin_first_name')
            last_name = data.get('sub_admin_last_name')
            password = data.get('password')

            # Get the logged-in user's school
            user = request.user
            school = School.objects.get(school_admin_username=user.username)

            # Create the User instance for the sub-admin
            sub_admin_user = User.objects.create_user(username=username, password=password)
            sub_admin_user.first_name = first_name
            sub_admin_user.last_name = last_name
            sub_admin_user.save()

            # Add the user to the "Sub Administrator" group (Group id = 2)
            sub_admin_group = Group.objects.get(id=2)
            sub_admin_user.groups.add(sub_admin_group)

            # Create the new sub-admin in School_admin model
            sub_admin = School_admin.objects.create(
                school_admin_username=username,
                school_admin_first_name=first_name,
                school_admin_last_name=last_name,
                school=school
            )
            sub_admin.save()

            return JsonResponse({'success': True, 'message': 'Sub Admin registered successfully!'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})