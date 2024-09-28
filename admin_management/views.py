from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from django.views.decorators.http import require_POST
from setup_authentication.models import *
import json 
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime,timedelta
import logging
# Create your views here.


logger = logging.getLogger(__name__)

def school_management(request): 
    return render(request,'administrator/school_management.html')


def manage_teachers_page(request): 
    return render(request,'administrator/manage_teachers/manage_teachers.html')

@login_required
def get_teachers(request):
    # Get the logged-in school admin's school
    school_admin = request.user.school_admin
    school = school_admin.school

    # Fetch all teachers linked to this school
    teachers = Teacher.objects.filter(school=school).select_related('employee')

    # Prepare data for the response
    teacher_list = []
    for teacher in teachers:
        class_teacher = Class_Teacher.objects.filter(teacher=teacher).first()

        teacher_data = {
            "id": teacher.id,
            "first_name": teacher.first_name,
            "last_name": teacher.last_name,
            "designation": teacher.employee.designation,
            "is_class_teacher": bool(class_teacher),
            "class_assigned": class_teacher.class_assigned if class_teacher else "",
            "division_assigned": class_teacher.division_assigned if class_teacher else "",
        }
        teacher_list.append(teacher_data)

    return JsonResponse({"teachers": teacher_list})

@login_required
def delete_teacher(request, teacher_id):
    # Fetch the teacher object
    teacher = get_object_or_404(Teacher, pk=teacher_id)

    # Delete the teacher, user, and employee linked to this teacher
    user = teacher.user
    employee = teacher.employee

    teacher.delete()  # Deletes teacher record
    employee.delete()  # Deletes employee record
    user.delete()  # Deletes user record

    return HttpResponse(status=204)


# Render the edit teacher page with populated details
def edit_teacher_page(request, teacher_id):
    return render(request, 'administrator/manage_teachers/edit_teacher.html', {
        'teacher': get_object_or_404(Teacher, id=teacher_id),
        'class_teacher': Class_Teacher.objects.filter(teacher__id=teacher_id).first()
    })

# Handle the teacher update
def edit_teacher(request):
    if request.method == 'POST':
        teacher_id = request.POST.get('teacher_id')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        class_assigned = request.POST.get('class_assigned')
        division_assigned = request.POST.get('division_assigned')
        override = request.POST.get('override') == 'true'  # Convert to boolean

        # Log received data
        logger.debug(f"Received teacher update request: teacher_id={teacher_id}, first_name={first_name}, last_name={last_name}, class_assigned={class_assigned}, division_assigned={division_assigned}, override={override}")

        # Get the teacher object
        teacher = get_object_or_404(Teacher, id=teacher_id)
        logger.debug(f"Fetched teacher: {teacher}")

        # Get related employee and user objects
        employee = teacher.employee
        user = teacher.user

        # Check if there's an existing class teacher for the same class and division
        existing_class_teacher = Class_Teacher.objects.filter(
            class_assigned=class_assigned,
            division_assigned=division_assigned,
            school=teacher.school
        ).exclude(teacher=teacher).first()

        if existing_class_teacher and not override:
            logger.debug(f"Existing class teacher conflict found: {existing_class_teacher}")
            return JsonResponse({'conflict': True, 'existing_teacher': existing_class_teacher.first_name})

        # Update Teacher model
        teacher.first_name = first_name
        teacher.last_name = last_name
        teacher.save()
        logger.debug(f"Updated teacher: {teacher}")

        # Update Employee model
        employee.first_name = first_name
        employee.second_name = last_name  # Assuming second_name is used for last name
        employee.save()
        logger.debug(f"Updated employee: {employee}")

        # Update User model
        if user:
            user.first_name = first_name
            user.last_name = last_name
            user.username = teacher.user_name  # Keep username consistent
            user.save()
            logger.debug(f"Updated user: {user.username}")

        # Handle Class_Teacher separately
        class_teacher = Class_Teacher.objects.filter(teacher=teacher).first()

        if teacher.is_class_teacher or override:  # If teacher is a class teacher or if override is requested

            # If there's an existing class teacher, remove them (i.e., transfer the class teacher role)
            if existing_class_teacher:
                logger.debug(f"Removing existing class teacher: {existing_class_teacher}")
                existing_class_teacher.delete()

            # Create or update the Class_Teacher assignment
            if class_teacher:
                logger.debug(f"Found class teacher record to update: {class_teacher}")
                class_teacher.first_name = first_name
                class_teacher.last_name = last_name
                class_teacher.user_name = user.username
                class_teacher.class_assigned = class_assigned
                class_teacher.division_assigned = division_assigned
                class_teacher.save()
                logger.debug(f"Updated class teacher: {class_teacher}")
            else:
                logger.debug(f"Creating new class teacher record for {teacher}")
                Class_Teacher.objects.create(
                    teacher=teacher,
                    user=user,
                    user_name=user.username,
                    first_name=first_name,
                    last_name=last_name,
                    school=teacher.school,
                    class_assigned=class_assigned,
                    division_assigned=division_assigned
                )
                logger.debug(f"Created new class teacher record for {teacher}")

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


def manage_student_page(request): 
    return render(request,'administrator/manage_students/admin_manage_students.html')

def get_classes_and_divisions(request):
    school_admin = School_admin.objects.get(user=request.user)
    class_teachers = Class_Teacher.objects.filter(school=school_admin.school)
    
    # Return class and division together in a dict
    class_division_list = class_teachers.values('class_assigned', 'division_assigned').distinct()
    
    return JsonResponse({'classes': list(class_division_list)})

    
def get_students(request):
    class_assigned = request.GET.get('class_assigned')
    division_assigned = request.GET.get('division_assigned')

    # Get the logged-in school admin's school
    school_admin = School_admin.objects.get(user=request.user)

    # Fetch students matching the class and division from the school
    students = Student.objects.filter(
        school=school_admin.school,
        class_assigned=class_assigned,
        division_assigned=division_assigned
    ).values('id', 'first_name', 'last_name', 'roll_number')

    return JsonResponse({'students': list(students)})

def admin_student_attendance_page(request):
    student_id = request.GET.get('student_id')  # Get student ID from query parameters
    student = get_object_or_404(Student, id=student_id)  # Fetch the student object
    return render(request, 'administrator/manage_students/admin_student_attendance_page.html', {'student': student})

def get_student_attendance(request):
    student_id = request.GET.get('student_id')
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')

    if not student_id or not from_date or not to_date:
        return JsonResponse({'error': 'Student ID, From Date, and To Date are required.'}, status=400)

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return JsonResponse({'error': 'Student not found.'}, status=404)

    # Convert from_date and to_date to date objects
    from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
    to_date = datetime.strptime(to_date, "%Y-%m-%d").date()

    # Create a list of all dates in the range
    all_dates = [from_date + timedelta(days=i) for i in range((to_date - from_date).days + 1)]

    # Query Attendance model for records in the date range
    absences = Attendance.objects.filter(student=student, date__range=[from_date, to_date])

    # Query LeaveReason model for reasons related to this student and within the date range
    leave_reasons = LeaveReason.objects.filter(student=student, date__range=[from_date, to_date])

    # Create a dictionary of absences keyed by date for fast lookup
    absent_dates = {absence.date: absence for absence in absences}

    # Create a dictionary for leave reasons keyed by date for fast lookup
    leave_reasons_dict = {reason.date: reason.reason for reason in leave_reasons}

    # Prepare the result data
    result_data = []
    for date in all_dates:
        if date.weekday() == 6:  # Sunday
            result_data.append({
                'date': date.strftime("%Y-%m-%d"),
                'is_present': None,  # None to indicate a Sunday
            })
        elif date in absent_dates:
            # Student was absent on this date
            reason = leave_reasons_dict.get(date, 'N/A')  # Get reason, default to 'N/A'
            result_data.append({
                'date': date.strftime("%Y-%m-%d"),
                'is_present': False,
                'reason': reason
            })
        else:
            # Student was present on this date
            result_data.append({
                'date': date.strftime("%Y-%m-%d"),
                'is_present': True,
                'reason': None  # No reason needed if present
            })

    return JsonResponse({'attendance': result_data})

def admin_view_marks_page(request, student_id):
    student = get_object_or_404(Student, id=student_id)  # Fetch the student object
    return render(request, 'administrator/manage_students/admin_view_student_marks.html', {'student': student})

def get_student_marks(request):
    student_id = request.GET.get('student_id')
    try:
        student = Student.objects.get(id=student_id)  # Adjust according to your model
        marks = Marks.objects.filter(student_id=student_id).select_related('exam', 'subject').values(
            'exam__exam_name', 
            'subject__subject_name', 
            'marks_obtained', 
            'out_of'
        )
        
        return JsonResponse({
            'marks': list(marks),
            'student_name': f"{student.first_name} {student.last_name}",  # Change according to your fields
        })
    except Student.DoesNotExist:
        return JsonResponse({'marks': [], 'student_name': ''})
    

def admin_class_attendance_page(request): 
    return render(request, 'administrator/class_attendance/admin_class_attendance.html')

@login_required
def get_classes_divisions(request):
    try:
        school_admin = School_admin.objects.get(user=request.user)
    except School_admin.DoesNotExist:
        return JsonResponse({'error': 'No school admin record found for the current user.'}, status=400)

    # Get distinct classes
    class_teachers = Class_Teacher.objects.filter(school=school_admin.school)
    classes = class_teachers.values('class_assigned').distinct()

    return JsonResponse({'classes': list(classes)})

@login_required
def get_divisions(request):
    class_assigned = request.GET.get('class_assigned')

    try:
        school_admin = School_admin.objects.get(user=request.user)
    except School_admin.DoesNotExist:
        return JsonResponse({'error': 'No school admin record found for the current user.'}, status=400)

    # Get divisions filtered by the selected class
    divisions = Class_Teacher.objects.filter(
        school=school_admin.school,
        class_assigned=class_assigned
    ).values('division_assigned').distinct()

    return JsonResponse({'divisions': list(divisions)})

@login_required
def get_attendance(request):
    class_assigned = request.GET.get('class_assigned')
    division_assigned = request.GET.get('division_assigned')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    except ValueError:
        return JsonResponse({'error': 'Invalid date format. Please use YYYY-MM-DD.'}, status=400)

    school_admin = School_admin.objects.get(user=request.user)
    students = Student.objects.filter(
        class_assigned=class_assigned,
        division_assigned=division_assigned,
        school=school_admin.school
    )

    attendance_data = []

    for student in students:
        student_attendance = []
        for n in range((end_date - start_date).days + 1):
            single_date = start_date + timedelta(n)
            formatted_date = single_date.strftime('%d/%m/%Y')
            is_sunday = single_date.weekday() == 6

            if not is_sunday:
                attendance_record = Attendance.objects.filter(student=student, date=single_date).first()
                status = 'Absent' if attendance_record and not attendance_record.is_present else 'Present'
                student_attendance.append({'date': formatted_date, 'status': status})
            else:
                student_attendance.append({'date': formatted_date, 'status': 'Holiday (Sunday)'})

        attendance_data.append({
            'student': {
                'first_name': student.first_name,
                'last_name': student.last_name,
                'admission_number': student.admission_number,
                'roll_number': student.roll_number,
                'class_assigned': class_assigned,
                'division_assigned': division_assigned,
            },
            'attendance': student_attendance
        })

    return JsonResponse({'attendance_list': attendance_data})

def admin_marks_page(request): 
    return render(request, 'administrator/class_marks/admin_marks_page.html')

@login_required
def get_academic_years(request):
    exams = Exam.objects.values_list('academic_year', flat=True).distinct()
    assignments = Assignment.objects.values_list('academic_year', flat=True).distinct()
    
    # Combine and remove duplicates
    academic_years = set(exams) | set(assignments)
    
    return JsonResponse({'academic_years': list(academic_years)})

@login_required
def get_class_student_marks(request):
    academic_year = request.GET.get('academic_year')
    class_assigned = request.GET.get('class_assigned')
    division_assigned = request.GET.get('division_assigned')

    # Fetch exam marks
    marks = Marks.objects.filter(
        exam__academic_year=academic_year,
        class_assigned=class_assigned,
        division_assigned=division_assigned
    ).select_related('student', 'subject', 'exam')

    # Format exam marks
    marks_list = []
    for mark in marks:
        marks_list.append({
            'student_name': f"{mark.student.first_name} {mark.student.last_name}",
            'admission_number': mark.student.admission_number,
            'roll_number': mark.student.roll_number,
            'subject_name': mark.subject.subject_name,
            'marks_obtained': mark.marks_obtained,
            'total_marks': mark.out_of,
            'exam_name': mark.exam.exam_name,
            'type': 'exam'  # Indicate this is an exam mark
        })

    # Fetch assignment marks
    assignment_marks = StudentAssignmentSubmission.objects.filter(
        assignment__academic_year=academic_year,
        student__class_assigned=class_assigned,
        student__division_assigned=division_assigned
    ).select_related('student', 'assignment')

    # Group assignment marks by subject
    assignment_dict = {}
    for assignment_mark in assignment_marks:
        key = (assignment_mark.student.admission_number, assignment_mark.student.roll_number, 
               f"{assignment_mark.student.first_name} {assignment_mark.student.last_name}")
        
        if assignment_mark.assignment.subject not in assignment_dict:
            assignment_dict[assignment_mark.assignment.subject] = {}
        
        if key not in assignment_dict[assignment_mark.assignment.subject]:
            assignment_dict[assignment_mark.assignment.subject][key] = {}

        assignment_dict[assignment_mark.assignment.subject][key][assignment_mark.assignment.title] = {
            'marks_obtained': assignment_mark.marks_obtained,
            'total_marks': assignment_mark.total_marks
        }

    # Prepare the final structured data for JSON response
    final_marks_list = []
    for subject, students in assignment_dict.items():
        for key, assignments in students.items():
            admission_number, roll_number, student_name = key
            marks_entry = {
                'subject_name': subject,
                'admission_number': admission_number,
                'roll_number': roll_number,
                'student_name': student_name
            }
            # Include each assignment's marks in the entry
            for assignment_title, marks in assignments.items():
                marks_entry[assignment_title] = f"{marks['marks_obtained']}/{marks['total_marks']}"

            final_marks_list.append(marks_entry)

    # Combine exam and assignment marks
    return JsonResponse({'marks': marks_list + final_marks_list})