from django.shortcuts import render

# Create your views here.
import io
from io import BytesIO
import xhtml2pdf.pisa as pisa
from datetime import timedelta, datetime
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string
from setup_authentication.models import *
from django.core.mail import send_mail
from django.utils.dateparse import parse_date
from django.views.decorators.http import require_http_methods
from datetime import date, timedelta
from django.template.loader import get_template
from django.http import HttpResponse

@login_required
def mark_student_attendance_page(request):
    return render(request, 'teacher/mark_student_attendance.html')

@login_required
def get_students(request):
    attendance_date = request.GET.get('attendance_date', date.today().strftime('%Y-%m-%d'))
    
    try:
        employee = Employee.objects.get(user=request.user)
        class_teacher = Class_Teacher.objects.get(teacher__employee=employee)
    except (Employee.DoesNotExist, Class_Teacher.DoesNotExist):
        return JsonResponse({'success': False, 'error_message': 'Class teacher not found.'}, status=404)
    
    students = Student.objects.filter(
        school=class_teacher.school,
        class_assigned=class_teacher.class_assigned,
        division_assigned=class_teacher.division_assigned
    )
    
    student_data = []
    for student in students:
        # Check if there's an attendance record for this student on the selected date
        attendance_record = Attendance.objects.filter(student=student, date=attendance_date).first()
        is_present = True  # Default to present
        if attendance_record and not attendance_record.is_present:
            is_present = False
        
        student_data.append({
            'id': student.id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'roll_number': student.roll_number,
            'is_present': is_present
        })
    
    return JsonResponse({'success': True, 'students': student_data})

@csrf_exempt
@login_required
def mark_student_attendance(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            selected_date = date.fromisoformat(data.get('attendance_date', date.today().strftime('%Y-%m-%d')))

            # Find the logged-in teacher
            teacher = Teacher.objects.get(user=request.user)
            
            for student in data['students']:
                student_id = student['student_id']
                status = student['status']
                student_obj = Student.objects.get(id=student_id)

                if status == 'absent':
                    Attendance.objects.update_or_create(
                        student=student_obj,
                        date=selected_date,
                        defaults={'is_present': False}
                    )
                    
                    # Create notification for all parents linked to this student
                    parents = Parent.objects.filter(students=student_obj)
                    for parent_obj in parents:
                        Notification.objects.create(
                            parent=parent_obj,
                            student=student_obj,
                            teacher=teacher,  # Link the logged-in teacher here
                            message=f'Your student {student_obj.first_name} {student_obj.last_name} was absent on {selected_date}.',
                            absence_date=selected_date,
                            student_name=f'{student_obj.first_name} {student_obj.last_name}',
                        )
                else:
                    Attendance.objects.filter(student=student_obj, date=selected_date).delete()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
def view_attendance_report_page(request):
    return render(request, 'teacher/view_attendance_report.html')

@login_required
def view_attendance_report(request):
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'No employee record found for the current user.'}, status=400)

    try:
        class_teacher = Class_Teacher.objects.get(teacher__employee=employee)
    except Class_Teacher.DoesNotExist:
        return JsonResponse({'error': 'No class teacher record found for the current employee.'}, status=400)

    students = Student.objects.filter(
        class_assigned=class_teacher.class_assigned,
        division_assigned=class_teacher.division_assigned,
        school=class_teacher.school
    )

    start_date_str = request.GET.get('start_date', date.today().strftime('%Y-%m-%d'))
    end_date_str = request.GET.get('end_date', date.today().strftime('%Y-%m-%d'))

    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    except ValueError:
        return JsonResponse({'error': 'Invalid date format. Please use YYYY-MM-DD.'}, status=400)

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
                'class_assigned': class_teacher.class_assigned,
                'division_assigned': class_teacher.division_assigned,
            },
            'attendance': student_attendance
        })

    return JsonResponse({'attendance_list': attendance_data})

@login_required
def attendance_report_pdf_page(request):
    return render(request, 'teacher/attendance_report_pdf.html')

@login_required
def individual_student_attendance_page(request):
    return render(request, 'teacher/individual_student_attendance.html')


@login_required
def get_class_students(request):
    user = request.user
    try:
        class_teacher = Class_Teacher.objects.get(user=user)
        students = Student.objects.filter(class_teacher=class_teacher)
    except Class_Teacher.DoesNotExist:
        students = []

    student_data = [
        {'id': student.id, 'first_name': student.first_name, 'last_name': student.last_name}
        for student in students
    ]

    return JsonResponse({'students': student_data})

@login_required
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

    # Query Attendance model for absent records in the date range
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
        if date.weekday() == 6:  # Sunday (0 is Monday, 6 is Sunday)
            result_data.append({
                'date': date,
                'is_present': None,  # None to indicate a Sunday
                
            })
        elif date in absent_dates:
            # Student was absent on this date, check if there is a leave reason
            reason = leave_reasons_dict.get(date, 'N/A')  # Get reason or 'N/A' if not available
            result_data.append({
                'date': date,
                'is_present': False,
                'reason': reason
            })
        else:
            # Student was present on this date (no absence record)
            result_data.append({
                'date': date,
                'is_present': True,
                'reason': None
            })

    return JsonResponse({
        'attendance': result_data
    })