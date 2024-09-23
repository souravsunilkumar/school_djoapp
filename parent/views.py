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

def parent_dashboard_page(request):
    return render(request,'parent/parent_dashboard.html')

@login_required
def parent_dashboard(request):
    parent = Parent.objects.get(user=request.user)
    students = parent.students.all()

    # Default selected student (first student or any other logic)
    selected_student = students.first() if students.exists() else None

    student_data = [{
        'id': student.id,
        'first_name': student.first_name,
        'last_name': student.last_name,
        'selected': student == selected_student
    } for student in students]

    response_data = {
        'parent_name': f"{parent.first_name} {parent.second_name}",
        'selected_student_name': f"{selected_student.first_name} {selected_student.last_name}" if selected_student else 'None',
        'students': student_data
    }

    return JsonResponse(response_data)

def get_attendance(request, student_id):
    # Adjust this based on your actual Attendance model and fields
    student = Student.objects.get(id=student_id)
    attendance_records = Attendance.objects.filter(student=student)

    data = {
        'attendance_records': [{'date': record.date, 'status': record.status} for record in attendance_records]
    }
    return JsonResponse(data)

@csrf_exempt
def attendance_report(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        student_id = data.get('student_id')
        from_date = data.get('from_date')
        to_date = data.get('to_date')

        # Convert string dates to datetime objects
        from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date = datetime.strptime(to_date, '%Y-%m-%d').date()

        student = Student.objects.get(id=student_id)
        attendance_records = Attendance.objects.filter(
            student=student,
            date__range=[from_date, to_date]
        )
        
        # Get reasons for absences
        reasons = LeaveReason.objects.filter(
            student=student,
            date__range=[from_date, to_date]
        ).values('date', 'reason')
        reason_dict = {str(r['date']): r['reason'] for r in reasons}

        # Create list of dates and report data
        dates = []
        report_data = []
        current_date = from_date
        while current_date <= to_date:
            dates.append(current_date.strftime('%Y-%m-%d'))
            record = next((r for r in attendance_records if r.date == current_date), None)
            status = 'Absent' if record and not record.is_present else 'Present'
            report_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'status': status
            })
            current_date += timedelta(days=1)
        
        return JsonResponse({
            'student_name': f"{student.first_name} {student.last_name}",
            'dates': dates,
            'attendance_records': report_data,
            'reasons': reason_dict
        })


@login_required
def parent_notifications(request):
    parent = Parent.objects.get(user=request.user)
    students = parent.students.all()

    # Fetch absence notifications
    absence_notifications = Notification.objects.filter(parent=parent).order_by('-timestamp')

    # Fetch assignment notifications for students linked to this parent
    assignment_notifications = AssignmentNotification.objects.filter(
        class_assigned__in=[student.class_assigned for student in students],
        division_assigned__in=[student.division_assigned for student in students],
        school=parent.school
    ).order_by('-date_sent')

    # Absence notification data
    notification_data = [
        {
            'id': notification.id,
            'message': notification.message,
            'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': notification.is_read,
            'student_name': notification.student_name,  # Assuming you have a method to get student full name
            'student_id': notification.student.id if notification.student else None,  # Include student ID
            'date': notification.absence_date.strftime('%Y-%m-%d') if notification.absence_date else None,
            'is_absent': notification.type == 'absent'  # Adjust this based on how you categorize notifications
        }
        for notification in absence_notifications
    ]

    # Assignment notification data
    assignment_notification_data = [
        {
            'id': assignment.notification_id,
            'message': f"{assignment.teacher.first_name} {assignment.teacher.last_name} has added an assignment for {assignment.subject}. Due date: {assignment.assignment.due_date}",
            'timestamp': assignment.date_sent.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': False,  # Assuming assignment notifications are unread initially
            'class_assigned': assignment.class_assigned,
            'division_assigned': assignment.division_assigned,
            
        }
        for assignment in assignment_notifications
    ]

    # Combine absence and assignment notifications
    combined_notifications = notification_data + assignment_notification_data
    combined_notifications.sort(key=lambda x: x['timestamp'], reverse=True)  # Sort by timestamp

    return JsonResponse({'notifications': combined_notifications})

@login_required
def absent_notifications(request):
    parent = Parent.objects.get(user=request.user)
    notifications = Notification.objects.filter(parent=parent, type='absent').order_by('-timestamp')

    notification_data = [
        {
            'id': notification.id,
            'message': notification.message,
            'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': notification.is_read,
            'student_name': notification.student_name,  # Assuming you have a method to get student full name
            'student_id': notification.student.id if notification.student else None,  # Include student ID
            'date': notification.absence_date.strftime('%Y-%m-%d') if notification.absence_date else None,
            'is_absent': notification.type == 'absent'  # Adjust this based on how you categorize notifications
        }
        for notification in notifications
    ]

    return JsonResponse({'notifications': notification_data})

@login_required
def mark_notifications_as_read(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            notification_ids = data.get('notification_ids', [])

            # Mark specified notifications as read
            Notification.objects.filter(id__in=notification_ids).update(is_read=True)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method'})

def submit_leave_reason(request):
    try:
        data = json.loads(request.body)
        print(f"Received data: {data}")  # Debugging line
        
        notification_id = data.get('notification_id')
        reason = data.get('reason')

        if not notification_id or not reason:
            return JsonResponse({'error': 'Notification ID and reason are required.'}, status=400)

        # Fetch the notification
        notification = Notification.objects.get(id=notification_id)

        # Check if a LeaveReason already exists for this notification
        existing_leave_reason = LeaveReason.objects.filter(parent_notification=notification).first()

        if existing_leave_reason:
            return JsonResponse({'error': 'Leave reason has already been submitted.'}, status=400)

        # Create the LeaveReason
        leave_reason = LeaveReason(
            student=notification.student,
            parent=notification.parent,
            teacher=notification.teacher,
            parent_notification=notification,
            reason=reason,
            date=notification.absence_date if notification.absence_date else None
        )
        leave_reason.save()

        # Create the TeacherNotification
        teacher_notification = TeacherNotification(
            teacher=notification.teacher,
            parent=notification.parent,
            student=notification.student,
            message=reason,  # Set the message to the reason
            reason=leave_reason,
            is_read=False
        )
        teacher_notification.save()

        # Optionally, mark the notification as read
        notification.is_read = True
        notification.save()

        return JsonResponse({'message': 'Leave reason submitted and notification sent successfully.'})
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
def check_reason_given(request):
    try:
        data = json.loads(request.body)
        notification_id = data.get('notification_id')

        if not notification_id:
            return JsonResponse({'error': 'Notification ID is required.'}, status=400)

        notification = Notification.objects.get(id=notification_id)
        reason_given = LeaveReason.objects.filter(parent_notification=notification).exists()

        return JsonResponse({'reason_given': reason_given})
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

def view_student_marks_page(request): 
    return render(request, 'parent/parent_view_student_marks.html')

@login_required
def get_academic_years(request):
    parent = Parent.objects.get(user=request.user)
    school_id = parent.school.school_id
    exams = Exam.objects.filter(school_id=school_id).values_list('academic_year', flat=True).distinct()
    return JsonResponse({'academic_years': list(exams)})

@login_required
def get_students_for_parent(request):
    try:
        # Get the parent associated with the logged-in user
        parent = Parent.objects.get(user=request.user)
        
        # Retrieve students associated with this parent
        students = parent.students.all()
        
        # Format the student data for the response
        student_data = [{
            'id': student.id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'class_assigned': student.class_assigned,
            'division_assigned': student.division_assigned
        } for student in students]
        
        # Prepare the response data
        response_data = {
            'parent_name': f"{parent.first_name} {parent.second_name}",
            'students': student_data
        }
        
        return JsonResponse(response_data)
    
    except Parent.DoesNotExist:
        return JsonResponse({'error': 'Parent not found'}, status=404)
    

@csrf_exempt
def get_student_marks(request):
    if request.method == 'GET':
        academic_year = request.GET.get('academic_year')
        student_id = request.GET.get('student_id')

        # Get the selected student
        student = get_object_or_404(Student, id=student_id)

        # Filter exams by academic year
        exams = Exam.objects.filter(academic_year=academic_year, school=student.school)

        # Filter marks by student and exams
        marks = Marks.objects.filter(student=student, exam__in=exams)

        # Prepare data for response
        marks_data = []
        for mark in marks:
            marks_data.append({
                'exam': mark.exam.exam_name,
                'subject': mark.subject.subject_name,
                'marks_obtained': mark.marks_obtained,
                'total_marks': mark.out_of,
                'student_name': f"{student.first_name} {student.last_name}"  # Add student name
            })

        response_data = {
            'marks': marks_data
        }

        return JsonResponse(response_data)

    return JsonResponse({'error': 'Invalid request method.'}, status=400)


@login_required
def get_student_progress(request):
    if request.method == 'GET':
        academic_year = request.GET.get('academic_year')
        student_id = request.GET.get('student_id')

        # Get the selected student
        student = get_object_or_404(Student, id=student_id)

        # Filter exams by academic year
        exams = Exam.objects.filter(academic_year=academic_year, school=student.school)
        print("Exams:", exams)

        # Filter marks by student and exams
        marks = Marks.objects.filter(student=student, exam__in=exams)
        print("Marks:", marks)

        # Group marks by subject
        progress_data = {}
        for mark in marks:
            subject_name = mark.subject.subject_name
            if subject_name not in progress_data:
                progress_data[subject_name] = []
            progress_data[subject_name].append({
                'exam_name': mark.exam.exam_name,
                'marks_obtained': mark.marks_obtained
            })

        response_data = {
            'progress': progress_data
        }

        return JsonResponse(response_data)

    return JsonResponse({'error': 'Invalid request method.'}, status=400)


def absent_page(request): 
    return render(request,'parent/absent_page.html')

def assignment_page(request): 
    return render(request,'parent/assignment_page.html')

@login_required
def parent_assignment_notifications(request):
    parent = Parent.objects.get(user=request.user)
    students = parent.students.all()

    # Fetch assignment notifications for students linked to this parent
    assignment_notifications = AssignmentNotification.objects.filter(
        class_assigned__in=[student.class_assigned for student in students],
        division_assigned__in=[student.division_assigned for student in students],
        school=parent.school
    ).order_by('-date_sent')

    notification_data = [
        {
            'id': notification.notification_id,
            'message': f"{notification.teacher.first_name} {notification.teacher.last_name} assigned '{notification.assignment.title}' for {notification.subject}.",
            'date_sent': notification.date_sent.strftime('%Y-%m-%d %H:%M:%S'),
            'assignment_id': notification.assignment.assignment_id,
            'is_read': notification.is_read
        }
        for notification in assignment_notifications
    ]

    return JsonResponse({'notifications': notification_data})

@login_required
def assignment_details(request, assignment_id):
    # Fetch the assignment based on the ID
    assignment = get_object_or_404(Assignment, pk=assignment_id)

    # Get the logged-in parent
    parent = get_object_or_404(Parent, user=request.user)

    # Retrieve students linked to the logged-in parent who belong to the class and division of the assignment
    students = parent.students.filter(class_assigned=assignment.class_assigned, division_assigned=assignment.division_assigned)

    # Prepare the response data
    response_data = {
        "title": assignment.title,
        "teacher": f"{assignment.teacher.first_name} {assignment.teacher.last_name}",
        "subject": assignment.subject,
        "due_date": assignment.due_date,
        "description": assignment.description,
        "students": []
    }

    # Populate student data with actual submission status and marks
    for student in students:
        # Check if a submission exists for this student and assignment
        submission = StudentAssignmentSubmission.objects.filter(assignment=assignment, student=student).first()

        if submission and submission.is_submitted:
            status = "submitted"
            marks = f"{submission.marks_obtained}/{submission.total_marks}" if submission.marks_obtained is not None else "0"
        else:
            status = "not submitted"
            marks = "0"

        # Append the student data to the response
        response_data["students"].append({
            "name": f"{student.first_name} {student.last_name}",
            "submitted": status,
            "marks": marks
        })

    return JsonResponse(response_data)