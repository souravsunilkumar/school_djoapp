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

def teacher_dashboard(request):
    """Render the teacher dashboard."""
    return render(request, 'teacher_dashboard.html')

def teacher_dashboard_data(request):
    if request.user.is_authenticated:
        try:
            teacher = get_object_or_404(Teacher, user=request.user)
            if teacher.is_class_teacher:
                class_teacher = teacher.class_teacher_set.first()
                students = Student.objects.filter(
                    class_assigned=class_teacher.class_assigned,
                    division_assigned=class_teacher.division_assigned,
                    school=class_teacher.school
                ).values('id', 'first_name', 'last_name', 'roll_number')  # Include 'id' field

                data = {
                    'is_class_teacher': True,
                    'class_assigned': class_teacher.class_assigned,
                    'division_assigned': class_teacher.division_assigned,
                    'students': list(students),
                }
            else:
                data = {
                    'is_class_teacher': False,
                    'students': []
                }
            return JsonResponse({'success': True, 'data': data})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'User not authenticated.'})

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

@csrf_exempt
def get_student(request, student_id):
    if request.method == 'GET':
        try:
            student = get_object_or_404(Student, id=student_id)
            data = {
                'first_name': student.first_name,
                'last_name': student.last_name,
                'gender': student.gender,
                'admission_number': student.admission_number,
                'roll_number': student.roll_number,
                'parents_number': student.parents_number,
                'parents_email': student.parents_email,
                'warden': student.warden.id if student.warden else 'not_a_hostler'
            }
            return JsonResponse({'success': True, 'data': data})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

def edit_student_page(request, student_id):
    return render(request, 'teacher/edit_student.html', {'student_id': student_id})

@csrf_exempt
def edit_student(request, student_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            student = get_object_or_404(Student, id=student_id)
            
            student.first_name = data.get('first_name', student.first_name)
            student.last_name = data.get('last_name', student.last_name)
            student.gender = data.get('gender', student.gender)
            student.admission_number = data.get('admission_number', student.admission_number)
            student.roll_number = data.get('roll_number', student.roll_number)
            student.parents_number = data.get('parents_number', student.parents_number)
            student.parents_email = data.get('parents_email', student.parents_email)

            # Handle 'warden' field
            warden_id = data.get('warden', None)
            if warden_id:
                student.warden_id = warden_id
            else:
                student.warden = None

            student.save()

            return JsonResponse({'success': True, 'message': 'Student updated successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

@csrf_exempt
def delete_student(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            student_id = data.get('student_id')
            student = get_object_or_404(Student, id=student_id)
            student.delete()
            return JsonResponse({'success': True, 'message': 'Student deleted successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})

def get_teacher_notifications(request):
    # Get the logged-in user
    logged_in_user = request.user
    
    # Identify the teacher linked to the logged-in user
    try:
        logged_in_teacher = Teacher.objects.get(user=logged_in_user)
    except Teacher.DoesNotExist:
        return JsonResponse({'success': False, 'notifications': []})  # If no teacher is found
    
    # Fetch notifications for the logged-in teacher
    notifications = TeacherNotification.objects.filter(teacher=logged_in_teacher, is_read=False)

    # Prepare the data to send as JSON response
    notification_list = []
    for notification in notifications:
        notification_list.append({
            'id': notification.id,
            'message': f"Leave reason for {notification.student.first_name} {notification.student.last_name} on {notification.reason.date}",
            'student': f"{notification.student.first_name} {notification.student.last_name}",
            'date': notification.reason.date.strftime("%Y-%m-%d"),
            'is_read': notification.is_read,
            'reason': notification.reason.reason,
        })

    return JsonResponse({'success': True, 'notifications': notification_list})