from django.shortcuts import redirect, render
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from .models import *
import json 
from .serializers import *
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import decorator_from_middleware
from django.middleware.cache import CacheMiddleware
from django.views.decorators.cache import cache_control

import logging
# Create your views here.


logger = logging.getLogger(__name__)


def home(request):
    """Redirect to the appropriate dashboard if the user is already logged in."""
    if request.user.is_authenticated:
        # Check if the user is in a specific group and redirect accordingly
        if request.user.groups.filter(id=1).exists():
            return redirect('/setup_auth/admin_dashboard/')
        elif request.user.groups.filter(id=2).exists():
            return redirect('/setup_auth/sub_admin_dashboard/')
        elif request.user.groups.filter(id=3).exists():
            return redirect('/management/teacher_dashboard/')
        elif request.user.groups.filter(id=8).exists():
            return redirect('/parent/parent_dashboard/')
        elif request.user.groups.filter(id=9).exists():
            return redirect('/web_admin/web_admin_dashboard/')
        else:
            return render(request, 'index.html')  # If user group is not recognized, show the home page
    else:
        # If the user is not logged in, render the default home page
        return render(request, 'index.html')

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

            # Create the school admin profile and link it to the user and school
            school_admin = School_admin.objects.create(
                school_admin_first_name=school_admin_first_name,
                school_admin_last_name=school_admin_last_name,
                school_admin_username=school_admin_username,  # Save username here
                user=user,  # Link the user to the school admin
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
def user_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)  # Use Django's built-in login function

                # Storing user info and group in session
                request.session['username'] = user.username
                request.session['user_id'] = user.id
                user_group = None

                # Determine user group and set redirect URL
                if user.groups.filter(id=1).exists():
                    request.session['user_group'] = 'admin'
                    user_group = 'admin'
                    redirect_url = '/setup_auth/admin_dashboard/'
                elif user.groups.filter(id=2).exists():
                    request.session['user_group'] = 'sub_admin'
                    user_group = 'sub_admin'
                    redirect_url = '/setup_auth/sub_admin_dashboard/'
                elif user.groups.filter(id=3).exists():
                    request.session['user_group'] = 'teacher'
                    user_group = 'teacher'
                    redirect_url = '/management/teacher_dashboard/'
                elif user.groups.filter(id=8).exists():
                    request.session['user_group'] = 'parent'
                    user_group = 'parent'
                    redirect_url = '/parent/parent_dashboard/'
                elif user.groups.filter(id=9).exists():
                    request.session['user_group'] = 'web_admin'
                    user_group = 'web_admin'
                    redirect_url = '/web_admin/web_admin_dashboard/'
                else:
                    return JsonResponse({'success': False, 'message': 'User is not authorized.'})

                print(f"User {user.username} logged in as {user_group}, session key: {request.session.session_key}")

                return JsonResponse({'success': True, 'redirect_url': redirect_url})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

@csrf_exempt
def is_logged_in(request):
    """Return the user's authentication status."""
    if request.user.is_authenticated:
        return JsonResponse({'is_authenticated': True})
    return JsonResponse({'is_authenticated': False})

@csrf_exempt
def user_logout(request):
    """Logout the user and end their session."""
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True, 'message': 'Successfully logged out.'})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def admin_dashboard(request):
    return render(request, 'administrator/admin_dashboard.html')

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def sub_admin_dashboard(request): 
    return render(request,'sub_admin_dashboard.html')

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


@csrf_exempt
def register_employee(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Extract data
            username = data.get('emp_username')
            first_name = data.get('emp_first_name')
            last_name = data.get('emp_last_name')
            contact_number = data.get('emp_contact')  # Ensure this is extracted
            designation = data.get('emp_designation')
            password = data.get('password')

            # Get the logged-in user's school
            user = request.user
            school = School.objects.get(school_admin_username=user.username)

            # Create User instance
            employee_user = User.objects.create_user(username=username, password=password)
            employee_user.first_name = first_name
            employee_user.last_name = last_name
            employee_user.save()

            # Create Employee instance
            employee = Employee.objects.create(
                user=employee_user,
                school=school,
                first_name=first_name,
                second_name=last_name,
                contact_number=contact_number,  # Save contact_number here
                designation=designation,
                user_name=username
            )
            employee.save()

            # Determine group and create related model
            group_mapping = {
                'Teacher': 3,
                'Peon': 4,
                'Security': 5,
                'Warden': 6,
                'Office Staff': 7
            }
            group_id = group_mapping.get(designation)
            if group_id:
                group = Group.objects.get(id=group_id)
                employee_user.groups.add(group)

            # Save in Teacher or Warden model if applicable
            if designation == 'Teacher':
                Teacher.objects.create(
                    employee=employee,
                    school=school,
                    user=employee_user,
                    first_name=first_name,
                    last_name=last_name,
                    user_name=username,
                    contact_number=contact_number  # Ensure this is saved
                )
            elif designation == 'Warden':
                Warden.objects.create(
                    employee=employee,
                    school=school,
                    user=employee_user,
                    first_name=first_name,
                    last_name=last_name,
                    user_name=username,
                    contact_number=contact_number
                )

            return JsonResponse({'success': True, 'message': 'Employee registered successfully!'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})




@csrf_exempt
def parent_register(request):
    return render(request, 'parent_register.html')

def get_schools(request):
    schools = School.objects.all()
    school_data = [{"school_id": school.school_id, "school_name": school.school_name} for school in schools]
    return JsonResponse({"schools": school_data})

def get_classes_and_divisions(request, school_id):
    students = Student.objects.filter(school_id=school_id)
    class_division_data = list(set(student.class_and_division for student in students))
    return JsonResponse({"classes": class_division_data})

def get_students(request, school_id, class_division):
    # Split the `class_division` string to get class and division separately
    class_assigned, division_assigned = class_division.split(' - ')
    
    # Filter students based on the separated class and division
    students = Student.objects.filter(
        school_id=school_id,
        class_assigned=class_assigned,
        division_assigned=division_assigned
    )
    
    student_data = [{"id": student.id, "first_name": student.first_name, "last_name": student.last_name} for student in students]
    
    return JsonResponse({"students": student_data})


@csrf_exempt
def register_parent(request):
    if request.method == 'POST':
        try:
            # Extract POST data
            first_name = request.POST.get('first_name')
            second_name = request.POST.get('second_name')
            email = request.POST.get('email')
            contact_number = request.POST.get('contact_number')
            username = request.POST.get('username')
            password = request.POST.get('password')
            confirm_password = request.POST.get('confirm_password')
            school_id = request.POST.get('school_id')
            class_division = request.POST.get('class_division')
            students = request.POST.getlist('students[]')  # Adjusted to handle list format

            logger.debug(f"Received data: first_name={first_name}, second_name={second_name}, email={email}, contact_number={contact_number}, username={username}, school_id={school_id}, class_division={class_division}, students={students}")

            # Check if all required fields are provided
            if not all([first_name, email, contact_number, username, password, confirm_password, school_id, class_division]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            # Check if passwords match
            if password != confirm_password:
                return JsonResponse({'error': 'Passwords do not match'}, status=400)

            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,  # Set email
                password=password,  # Password is already hashed by create_user
                first_name=first_name,
                last_name=second_name
            )

            # Assign user to parent group
            try:
                parent_group = Group.objects.get(id=8)
                user.groups.add(parent_group)
            except Group.DoesNotExist:
                logger.error("Parent group with ID 8 does not exist")
                return JsonResponse({'error': 'Parent group does not exist'}, status=400)

            # Create parent
            parent = Parent.objects.create(
                first_name=first_name,
                second_name=second_name,
                username=username,
                user=user,
                school_id=school_id,
                contact_number=contact_number,
                email=email
            )

            # Add students to the parent
            for student_id in students:
                try:
                    student = Student.objects.get(id=student_id)
                    parent.students.add(student)
                except ObjectDoesNotExist:
                    logger.error(f"Student with ID {student_id} does not exist")
                    return JsonResponse({'error': f'Student with ID {student_id} does not exist'}, status=400)

            parent.save()  # Ensure the parent instance is saved with the updated students

            return JsonResponse({'success': True})
        
        except Exception as e:
            logger.error(f"Error in register_parent: {str(e)}")
            return JsonResponse({'error': 'An unexpected error occurred'}, status=500)
        

def student_attendance(request, student_id):
    try:
        student = Student.objects.get(id=student_id)
        attendance_records = Attendance.objects.filter(student=student)
        
        attendance_details = [
            {
                'name': student.first_name + ' ' + student.last_name,
                'date': record.date.strftime('%Y-%m-%d'),
                'attendance_status': 'Present' if record.is_present else 'Absent',
                'reason': record.reason or 'N/A'
            }
            for record in attendance_records
        ]
        
        return JsonResponse({'success': True, 'attendance_details': attendance_details})
    except Student.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Student not found.'}, status=404)