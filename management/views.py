import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from setup_authentication.models import *

def get_teachers(request):
    if request.method == "GET":
        username = request.user.username

        try:
            school_admin = School_admin.objects.get(school_admin_username=username)
            school = school_admin.school

            teachers = Teacher.objects.filter(school=school).values('id', 'first_name', 'last_name')
            teachers_list = [
                {
                    'id': teacher['id'],
                    'full_name': f"{teacher['first_name']} {teacher['last_name']}"
                }
                for teacher in teachers
            ]

            return JsonResponse({'teachers': teachers_list})
        except School_admin.DoesNotExist:
            return JsonResponse({'error': 'School admin not found.'})
        except Exception as e:
            return JsonResponse({'error': str(e)})

    return JsonResponse({'error': 'Invalid request method.'})

@csrf_exempt
def assign_class_teacher(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            teacher_id = data.get('teacher')
            class_name = data.get('class')
            division = data.get('division')

            # Fetch the teacher instance
            teacher = get_object_or_404(Teacher, id=teacher_id)

            # Mark the teacher as a class teacher
            teacher.is_class_teacher = True
            teacher.save()

            # Create the Class_Teacher instance, automatically filling in user and name fields
            Class_Teacher.objects.create(
                teacher=teacher,
                user=teacher.user,  # Automatically link to the User instance
                user_name=teacher.user.username,  # Fill in the username
                first_name=teacher.first_name,
                last_name=teacher.last_name,
                school=teacher.school,
                class_assigned=class_name,
                division_assigned=division
            )

            return JsonResponse({'success': True, 'message': 'Teacher assigned as class teacher successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

def admin_assign_class_teacher(request):
    return render(request, 'administrator/admin_assign_class_teacher.html')

def add_students_view(request):
    return render(request,'teacher/add_student.html')

def get_wardens(request):
    if request.method == 'GET':
        try:
            # Fetch wardens assigned to the school
            user = request.user
            class_teacher = Class_Teacher.objects.get(user=user)
            wardens = Warden.objects.filter(school=class_teacher.school)

            # Prepare the list of wardens
            wardens_list = [{'id': warden.id, 'name': f"{warden.first_name} {warden.last_name}"} for warden in wardens]

            

            return JsonResponse({'success': True, 'wardens': wardens_list})
        except Class_Teacher.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Class teacher record not found.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

@csrf_exempt
@login_required
def add_student(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = request.user
            class_teacher = Class_Teacher.objects.get(user=user)

            student = Student(
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                gender=data.get('gender'),
                admission_number=data.get('admission_number'),
                roll_number=data.get('roll_number'),
                parents_number=data.get('parents_number'),
                parents_email=data.get('parents_email'),
                class_assigned=class_teacher.class_assigned,  # Use class from logged-in teacher
                division_assigned=class_teacher.division_assigned,  # Use division from logged-in teacher
                school=class_teacher.school,  # Use school from logged-in teacher
                class_teacher=class_teacher,  # Save the logged-in class teacher
                warden=data.get('warden') if data.get('warden') != 'not_a_hostler' else None  
            )
            student.save()

            return JsonResponse({'success': True, 'message': 'Student added successfully.'})
        except Class_Teacher.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Class teacher record not found.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})