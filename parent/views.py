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
from django.db.models import F
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

def unread_notifications_count(request):
    try:
        parent = Parent.objects.get(user=request.user)
        unread_count = 0

        if parent:
            # Get the count of unread notifications for this parent
            unread_count += Notification.objects.filter(parent=parent, is_read=False).count()
            unread_count += AssignmentNotification.objects.filter(teacher__school=parent.school, is_read=False).count()
            unread_count += EventNotification.objects.filter(school=parent.school, is_read=False).count()

            # Get the classes and divisions of the students linked to the parent
            student_classes_divisions = parent.students.values_list('class_assigned', 'division_assigned', flat=True)

            # Count unread timetable notifications only for matching classes and divisions
            unread_count += TimetableNotification.objects.filter(
                school=parent.school,
                is_read=False,
                class_assigned__in=[class_div[0] for class_div in student_classes_divisions],
                division_assigned__in=[class_div[1] for class_div in student_classes_divisions]
            ).count()

    except Parent.DoesNotExist:
        return JsonResponse({'error': 'Parent not found'}, status=404)

    return JsonResponse({'unread_count': unread_count})

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
    ).order_by('-timestamp')

    # Fetch event notifications for the school linked to students of the parent
    student_schools = students.values_list('school', flat=True).distinct()
    event_notifications = EventNotification.objects.filter(school__in=student_schools).order_by('-timestamp')

    # Fetch timetable notifications for the students linked to the parent
    timetable_notifications = TimetableNotification.objects.filter(
        class_assigned__in=[student.class_assigned for student in students],
        division_assigned__in=[student.division_assigned for student in students],
        school=parent.school
    ).order_by('-timestamp')

    # Absence notification data
    notification_data = [
        {
            'id': notification.id,
            'message': notification.message,
            'timestamp': notification.timestamp,
            'is_read': notification.is_read,
            'student_name': notification.student_name,
            'student_id': notification.student.id if notification.student else None,
            'date': notification.absence_date.strftime('%Y-%m-%d') if notification.absence_date else None,
            'is_absent': notification.type == 'absent'
        }
        for notification in absence_notifications
    ]

    # Assignment notification data
    assignment_notification_data = [
        {
            'id': assignment.notification_id,
            'message': f"{assignment.teacher.first_name} {assignment.teacher.last_name} has added an assignment for {assignment.subject}. Due date: {assignment.assignment.due_date}",
            'timestamp': assignment.timestamp,
            'is_read': assignment.is_read,
            'class_assigned': assignment.class_assigned,
            'division_assigned': assignment.division_assigned,
        }
        for assignment in assignment_notifications
    ]

    # Event notification data
    event_notification_data = [
        {
            'id': event_notification.event_notification_id,
            'message': event_notification.title,
            'timestamp': event_notification.timestamp,
            'is_read': event_notification.is_read,
            'type': event_notification.type,
        }
        for event_notification in event_notifications
    ]

    # Timetable notification data
    timetable_notification_data = [
        {
            'id': timetable_notification.timetable_notification_id,
            'message': timetable_notification.message,
            'timestamp': timetable_notification.timestamp,
            'is_read': timetable_notification.is_read,
            'type': timetable_notification.type,
            'class_assigned': timetable_notification.class_assigned,
            'division_assigned': timetable_notification.division_assigned,
        }
        for timetable_notification in timetable_notifications
    ]

    # Combine all notifications
    combined_notifications = notification_data + assignment_notification_data + event_notification_data + timetable_notification_data

    # Sort by timestamp in descending order
    combined_notifications.sort(key=lambda x: x['timestamp'], reverse=True)

    # Convert timestamps to string format for JSON response
    for notification in combined_notifications:
        notification['timestamp'] = notification['timestamp'].strftime('%Y-%m-%d %H:%M:%S')

    return JsonResponse({'notifications': combined_notifications})

@login_required
@require_POST
def mark_notification_as_read(request, notification_id):
    # Attempt to find the notification in each model
    try:
        # Check for absence notifications
        notification = Notification.objects.get(id=notification_id, parent__user=request.user)
        notification.is_read = True
        notification.save()
        notification_type = 'absence'
    except Notification.DoesNotExist:
        try:
            # Check for assignment notifications
            notification = AssignmentNotification.objects.get(notification_id=notification_id)
            notification.is_read = True
            notification.save()
            notification_type = 'assignment'
        except AssignmentNotification.DoesNotExist:
            try:
                # Check for event notifications
                notification = EventNotification.objects.get(event_notification_id=notification_id)
                notification.is_read = True
                notification.save()
                notification_type = 'event'
            except EventNotification.DoesNotExist:
                try:
                    # Check for timetable notifications
                    notification = TimetableNotification.objects.get(timetable_notification_id=notification_id)
                    notification.is_read = True
                    notification.save()
                    notification_type = 'timetable'
                except TimetableNotification.DoesNotExist:
                    return JsonResponse({'error': 'Notification not found'}, status=404)

    return JsonResponse({'success': True, 'type': notification_type})


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
    ).order_by('-timestamp')

    notification_data = [
        {
            'id': notification.notification_id,
            'message': f"{notification.teacher.first_name} {notification.teacher.last_name} assigned '{notification.assignment.title}' for {notification.subject}.",
            'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
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
    students = parent.students.filter(
        school=assignment.school, 
        class_assigned=assignment.class_assigned, 
        division_assigned=assignment.division_assigned
    )

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
        # Check if the student's school, class, and division match the assignment
        if (student.school == assignment.school and
            student.class_assigned == assignment.class_assigned and
            student.division_assigned == assignment.division_assigned):
            
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





def  add_student_page(request): 
    return render(request,'parent/add_student_page.html')

def get_schools(request):
    schools = School.objects.all()
    school_data = [{"school_id": school.school_id, "school_name": school.school_name} for school in schools]
    return JsonResponse({"schools": school_data})

def get_classes_and_divisions(request, school_id):
    students = Student.objects.filter(school_id=school_id)
    class_division_data = list(set(f"{student.class_assigned} - {student.division_assigned}" for student in students))
    return JsonResponse({"classes": class_division_data})

def get_students(request, school_id, class_division):
    class_assigned, division_assigned = class_division.split(' - ')
    students = Student.objects.filter(
        school_id=school_id,
        class_assigned=class_assigned,
        division_assigned=division_assigned
    )
    student_data = [{"id": student.id, "first_name": student.first_name, "last_name": student.last_name} for student in students]
    return JsonResponse({"students": student_data})

@csrf_exempt
def link_student(request):
    if request.method == 'POST':
        student_id = request.POST.get('student_id')

        # Get the parent for the currently logged-in user
        parent = get_object_or_404(Parent, user=request.user)
        student = get_object_or_404(Student, id=student_id)

        # Link the student to the logged-in parent
        parent.students.add(student)
        parent.save()

        return JsonResponse({"message": "Student linked successfully!"})
    
    # If the request is not POST, return a bad request response
    return JsonResponse({"error": "Invalid request method"}, status=400)


def parent_event_page(request): 
    return render(request,'parent/parent_event_page.html')

def get_event_banners(request):
    parent = Parent.objects.get(user=request.user)  # Get the logged-in parent
    students = parent.students.all()  # Get all the students linked to the parent

    # Dictionary to store school-wise events
    school_events = {}

    # Set to track processed schools to avoid duplicates
    processed_schools = set()

    for student in students:
        school = student.school

        # If the school has already been processed, skip it
        if school.school_id in processed_schools:
            continue

        # Mark the school as processed
        processed_schools.add(school.school_id)

        # Get all events and banners for the school
        events = Event.objects.filter(school=school).prefetch_related('banners')

        # Store event details for the school
        school_events[school.school_id] = {
            'school_name': school.school_name,
            'student_name': f"{student.first_name} {student.last_name}",
            'events': []
        }

        # Add event details with their banners
        for event in events:
            school_events[school.school_id]['events'].append({
                'event_id': event.event_id,  # Ensure event_id is included
                'event_title': event.title,
                'event_date': event.event_date,
                'banners': [{
                    'banner_title': banner.banner_title,
                    'banner_image': banner.banner_image.url
                } for banner in event.banners.all()]
            })

    # Prepare the response data
    response_data = {
        'school_events': list(school_events.values())
    }

    return JsonResponse(response_data)

def parent_event_details_page(request): 
    return render(request,'parent/parent_event_details_page.html')


def get_event_details(request, event_id):
    try:
        # Fetch the event by its ID
        event = Event.objects.get(pk=event_id)

        # Fetch related media for the event
        media_files = EventMedia.objects.filter(event=event)

        # Prepare media data to include both media file and YouTube link
        media_data = []
        for media in media_files:
            if media.media_file:
                media_data.append({
                    'type': 'file',
                    'file': media.media_file.url
                })
            if media.youtube_link:
                media_data.append({
                    'type': 'youtube',
                    'link': media.youtube_link
                })

        # Prepare response data
        response_data = {
            'title': event.title,
            'description': event.description,
            'event_date': event.event_date,
            'feature_image': event.feature_image.url if event.feature_image else None,
            'media': media_data
        }

        return JsonResponse(response_data)

    except Event.DoesNotExist:
        return JsonResponse({'error': 'Event not found'}, status=404)
    
def timetables_page(request): 
    return render(request,'parent/timetables_page.html')

def get_exam_timetables(request):
    if request.method == 'GET':
        try:
            # Access the Parent model via the user
            parent = Parent.objects.get(user=request.user)
        except Parent.DoesNotExist:
            return JsonResponse({'error': 'Parent not found'}, status=404)
        
        # Get students associated with this parent via the ManyToMany field
        students = parent.students.all()  
        
        # Collect the distinct exams and academic years where the student's class and division match the timetable
        timetables_list = []
        for student in students:
            class_assigned = student.class_assigned
            division_assigned = student.division_assigned

            # Filter the timetables for the student's class and division
            timetables = ExamTimetable.objects.filter(
                school=student.school,
                class_assigned=class_assigned,
                division_assigned=division_assigned
            ).values('exam__exam_name', 'academic_year').distinct()

            # Add unique timetables to the list
            for timetable in timetables:
                if timetable not in timetables_list:
                    timetables_list.append(timetable)
        
        # Return the list as JSON
        return JsonResponse({'timetables': timetables_list})
    


def get_exam_details(request):
    if request.method == 'GET':
        exam_name = request.GET.get('exam_name')
        academic_year = request.GET.get('academic_year')

        # Get the parent and associated students
        try:
            parent = Parent.objects.get(user=request.user)
            students = parent.students.all()
        except Parent.DoesNotExist:
            return JsonResponse({'error': 'Parent not found'}, status=404)

        # Collect the details based on the selected exam and academic year
        details_list = []
        for student in students:
            class_assigned = student.class_assigned
            division_assigned = student.division_assigned

            # Filter the details for the selected exam and academic year
            details = ExamTimetable.objects.filter(
                school=student.school,
                class_assigned=class_assigned,
                division_assigned=division_assigned,
                exam__exam_name=exam_name,
                academic_year=academic_year
            ).values('subject', 'exam_date', 'exam_time')

            # Add unique details to the list
            for detail in details:
                # Format the exam_date to 'dd/mm/yyyy'
                formatted_date = detail['exam_date'].strftime('%d/%m/%Y') if detail['exam_date'] else None
                details_list.append({
                    'subject': detail['subject'],
                    'exam_date': formatted_date,  # Use the formatted date
                    'exam_time': detail['exam_time']
                })

        # Return the details as JSON
        return JsonResponse({'details': details_list})