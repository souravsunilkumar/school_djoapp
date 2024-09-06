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
            'attendance_records': report_data
        })


@login_required
def parent_notifications(request):
    parent = Parent.objects.get(user=request.user)
    notifications = Notification.objects.filter(parent=parent).order_by('-timestamp')

    notification_data = [
        {
            'id': notification.id,
            'message': notification.message,
            'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': notification.is_read,
            'student_name': notification.student_name,  # Assuming you have a method to get student full name
            'date': notification.absence_date  # Adjust format if needed
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