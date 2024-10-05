import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from setup_authentication.models import *
from django.views.decorators.http import require_GET, require_POST
from django.utils.decorators import decorator_from_middleware
from django.middleware.cache import CacheMiddleware
from django.views.decorators.cache import cache_control
from django.db.models import Q

logger = logging.getLogger(__name__)

def get_teachers(request):
    if request.method == "GET":
        username = request.user.username

        try:
            school_admin = School_admin.objects.get(school_admin_username=username)
            school = school_admin.school

            search_query = request.GET.get('search', '')

            # Fetch all teachers or filter if search query is provided
            if search_query:
                teachers = Teacher.objects.filter(
                    Q(first_name__icontains=search_query) | Q(last_name__icontains=search_query),
                    school=school
                )
            else:
                teachers = Teacher.objects.filter(school=school)

            teachers_list = [
                {
                    "id": teacher.id,
                    "full_name": f"{teacher.first_name} {teacher.last_name}",
                }
                for teacher in teachers
            ]

            return JsonResponse({"teachers": teachers_list})
        except School_admin.DoesNotExist:
            return JsonResponse({"error": "School admin not found."})
        except Exception as e:
            return JsonResponse({"error": str(e)})

    return JsonResponse({"error": "Invalid request method."})

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def teacher_dashboard(request):
    """Render the teacher dashboard."""
    return render(request, "teacher/teacher_dashboard.html")


def teacher_dashboard_data(request):
    if request.user.is_authenticated:
        try:
            teacher = get_object_or_404(Teacher, user=request.user)

            if teacher.is_class_teacher:
                # Fetch class teacher data
                class_teacher = get_object_or_404(Class_Teacher, teacher=teacher)

                # Fetch students for the class and division assigned to the teacher
                students = Student.objects.filter(
                    class_assigned=class_teacher.class_assigned,
                    division_assigned=class_teacher.division_assigned,
                    school=class_teacher.school,
                ).values(
                    "id", "first_name", "last_name", "roll_number"
                )  # Include 'id' field

                data = {
                    "is_class_teacher": True,
                    "teacher_name": f"{teacher.first_name} {teacher.last_name}",
                    "class_assigned": class_teacher.class_assigned,
                    "division_assigned": class_teacher.division_assigned,
                    "students": list(students),
                }
            else:
                data = {
                    "is_class_teacher": False,
                    "teacher_name": f"{teacher.first_name} {teacher.last_name}",
                    "students": [],
                }

            return JsonResponse({"success": True, "data": data})

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    return JsonResponse({"success": False, "message": "User not authenticated."})


@csrf_exempt
def assign_class_teacher(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            teacher_id = data.get("teacher")
            class_name = data.get("class")
            division = data.get("division")

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
                division_assigned=division,
            )

            return JsonResponse(
                {
                    "success": True,
                    "message": "Teacher assigned as class teacher successfully.",
                }
            )
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Invalid request method."})


def admin_assign_class_teacher(request):
    return render(request, "administrator/admin_assign_class_teacher.html")


def add_students_view(request):
    return render(request, "teacher/add_student.html")


def get_wardens(request):
    if request.method == "GET":
        try:
            # Fetch wardens assigned to the school
            user = request.user
            class_teacher = Class_Teacher.objects.get(user=user)
            wardens = Warden.objects.filter(school=class_teacher.school)

            # Prepare the list of wardens
            wardens_list = [
                {"id": warden.id, "name": f"{warden.first_name} {warden.last_name}"}
                for warden in wardens
            ]

            return JsonResponse({"success": True, "wardens": wardens_list})
        except Class_Teacher.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "Class teacher record not found."}
            )
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Invalid request method."})


@csrf_exempt
@login_required
def add_student(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user = request.user
            class_teacher = Class_Teacher.objects.get(user=user)

            student = Student(
                first_name=data.get("first_name"),
                last_name=data.get("last_name"),
                gender=data.get("gender"),
                admission_number=data.get("admission_number"),
                roll_number=data.get("roll_number"),
                parents_number=data.get("parents_number"),
                parents_email=data.get("parents_email"),
                class_assigned=class_teacher.class_assigned,  # Use class from logged-in teacher
                division_assigned=class_teacher.division_assigned,  # Use division from logged-in teacher
                school=class_teacher.school,  # Use school from logged-in teacher
                class_teacher=class_teacher,  # Save the logged-in class teacher
                warden=(
                    data.get("warden")
                    if data.get("warden") != "not_a_hostler"
                    else None
                ),
            )
            student.save()

            return JsonResponse(
                {"success": True, "message": "Student added successfully."}
            )
        except Class_Teacher.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "Class teacher record not found."}
            )
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Invalid request method."})


@csrf_exempt
def get_student(request, student_id):
    if request.method == "GET":
        try:
            student = get_object_or_404(Student, id=student_id)
            data = {
                "first_name": student.first_name,
                "last_name": student.last_name,
                "gender": student.gender,
                "admission_number": student.admission_number,
                "roll_number": student.roll_number,
                "parents_number": student.parents_number,
                "parents_email": student.parents_email,
                "warden": student.warden.id if student.warden else "not_a_hostler",
            }
            return JsonResponse({"success": True, "data": data})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Invalid request method."})


def edit_student_page(request, student_id):
    return render(request, "teacher/edit_student.html", {"student_id": student_id})


@csrf_exempt
def edit_student(request, student_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            student = get_object_or_404(Student, id=student_id)

            student.first_name = data.get("first_name", student.first_name)
            student.last_name = data.get("last_name", student.last_name)
            student.gender = data.get("gender", student.gender)
            student.admission_number = data.get(
                "admission_number", student.admission_number
            )
            student.roll_number = data.get("roll_number", student.roll_number)
            student.parents_number = data.get("parents_number", student.parents_number)
            student.parents_email = data.get("parents_email", student.parents_email)

            # Handle 'warden' field
            warden_id = data.get("warden", None)
            if warden_id:
                student.warden_id = warden_id
            else:
                student.warden = None

            student.save()

            return JsonResponse(
                {"success": True, "message": "Student updated successfully."}
            )
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Invalid request method."})


@csrf_exempt
def delete_student(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            student_id = data.get("student_id")
            student = get_object_or_404(Student, id=student_id)
            student.delete()
            return JsonResponse(
                {"success": True, "message": "Student deleted successfully."}
            )
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Invalid request method."})


def get_teacher_notifications(request):
    # Get the logged-in user
    logged_in_user = request.user

    # Identify the teacher linked to the logged-in user
    try:
        logged_in_teacher = Teacher.objects.get(user=logged_in_user)
    except Teacher.DoesNotExist:
        return JsonResponse(
            {"success": False, "notifications": []}
        )  # If no teacher is found

    # Fetch notifications for the logged-in teacher
    notifications = TeacherNotification.objects.filter(
        teacher=logged_in_teacher, is_read=False
    )

    # Prepare the data to send as JSON response
    notification_list = []
    for notification in notifications:
        notification_list.append(
            {
                "id": notification.id,
                "message": f"Leave reason for {notification.student.first_name} {notification.student.last_name} on {notification.reason.date}",
                "student": f"{notification.student.first_name} {notification.student.last_name}",
                "date": notification.reason.date.strftime("%Y-%m-%d"),
                "is_read": notification.is_read,
                "reason": notification.reason.reason,
            }
        )

    return JsonResponse({"success": True, "notifications": notification_list})


def add_students_marks(request):
    return render(request, "teacher/add_students_marks.html")


@login_required
def add_exam(request):
    if request.method == 'POST':
        exam_name = request.POST.get('exam_name')
        academic_year = request.POST.get('academic_year')

        # Get the logged-in teacher
        teacher = Teacher.objects.get(user=request.user)
        school = teacher.school

        if not exam_name or not academic_year:
            return JsonResponse({'success': False, 'error': 'Invalid input.'})

        # Create the exam and link it to the teacher's school and school admin
        exam = Exam.objects.create(
            exam_name=exam_name,
            academic_year=academic_year,
            school=school,
            school_admin_username=school.school_admin_username
        )

        return JsonResponse({
            'success': True,
            'exam_id': exam.exam_id,
            'exam_name': exam.exam_name
        })
    
    return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=400)

@login_required
def get_academic_years(request):
    try:
        teacher = Teacher.objects.get(user=request.user)
        school = teacher.school

        # Get distinct academic years for exams linked to this school
        academic_years = Exam.objects.filter(school=school).values_list('academic_year', flat=True).distinct()

        # Return JSON response with academic years
        return JsonResponse({'academic_years': list(academic_years)})
    except Teacher.DoesNotExist:
        return JsonResponse({'academic_years': []})
    

def get_classes_and_divisions(request):
    if request.method == "GET":
        teacher = request.user.teacher
        school_id = teacher.school_id
        classes = Class_Teacher.objects.filter(school_id=school_id).values('class_assigned').distinct()

        selected_class = request.GET.get('class_id')
        divisions = []

        # If a class is selected, filter divisions based on the class
        if selected_class:
            divisions = Class_Teacher.objects.filter(school_id=school_id, class_assigned=selected_class).values('division_assigned')

        return JsonResponse({
            'classes': list(classes),
            'divisions': list(divisions),
        })

    return JsonResponse({"error": "Invalid request method."}, status=405)

@login_required
def get_exams(request):
    academic_year = request.GET.get('academic_year')
    teacher = request.user.teacher

    if academic_year:
        exams = Exam.objects.filter(school=teacher.school, academic_year=academic_year).values('exam_id', 'exam_name')
        return JsonResponse({'exams': list(exams)})
    else:
        return JsonResponse({'exams': []})
    
@csrf_exempt
def add_subject(request):
    if request.method == 'POST':
        data = request.POST
        subject_name = data.get('subject_name')
        academic_year = data.get('academic_year')
        exam_id = data.get('exam')
        class_assigned = data.get('class_assigned')
        division_assigned = data.get('division_assigned')

        # Get the logged-in teacher
        teacher = request.user.teacher
        school = teacher.school
        user_name = teacher.user_name

        try:
            exam = Exam.objects.get(exam_id=exam_id)
            subject = Subject(
                teacher=teacher,
                user_name=user_name,
                school=school,
                exam=exam,
                class_assigned=class_assigned,
                division_assigned=division_assigned,
                subject_name=subject_name
            )
            subject.save()
            return JsonResponse({'success': True})
        except Exam.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Exam does not exist.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=405)


def add_marks_page(request): 
    return render(request,'teacher/add_marks.html')

def get_subject(request):
    exam_id = request.GET.get('exam_id')
    class_assigned = request.GET.get('class_assigned')
    division_assigned = request.GET.get('division_assigned')

    if not exam_id or not class_assigned or not division_assigned:
        return JsonResponse({'error': 'Missing parameters'}, status=400)

    # Filter subjects by exam, class, and division
    subjects = Subject.objects.filter(
        exam_id=exam_id,
        class_assigned=class_assigned,
        division_assigned=division_assigned
    )

    # Create a list of subjects with subject_id and subject_name
    subject_list = [
        {
            'subject_id': subject.subject_id,
            'subject_name': subject.subject_name
        }
        for subject in subjects
    ]

    # Return the list of subjects as JSON
    return JsonResponse({'subjects': subject_list})
def get_students(request):
    exam_id = request.GET.get('exam_id')
    class_assigned = request.GET.get('class_assigned')
    division_assigned = request.GET.get('division_assigned')
    
    try:
        exam = Exam.objects.get(pk=exam_id)
        students = Student.objects.filter(
            school=exam.school,
            class_assigned=class_assigned,
            division_assigned=division_assigned
        )
        
        students_data = [{'id': student.id, 'first_name': student.first_name, 'last_name': student.last_name} for student in students]
        return JsonResponse({'students': students_data})
    
    except Exam.DoesNotExist:
        return JsonResponse({'students': [], 'error': 'Exam does not exist.'})
    except Exception as e:
        return JsonResponse({'students': [], 'error': str(e)})

@csrf_exempt
def add_marks(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            academic_year = data.get('academic_year')
            exam_id = data.get('exam')
            class_assigned = data.get('class_assigned')
            division_assigned = data.get('division_assigned')
            subject_id = data.get('subject')
            marks = data.get('marks', {})
            
            for student_id, mark_data in marks.items():
                student = get_object_or_404(Student, pk=student_id)
                subject = get_object_or_404(Subject, pk=subject_id)
                Marks.objects.create(
                    school=student.school,
                    teacher=request.user.teacher,
                    class_assigned=class_assigned,
                    division_assigned=division_assigned,
                    exam_id=exam_id,
                    student=student,
                    subject=subject,
                    marks_obtained=mark_data.get('marks_obtained'),
                    out_of=mark_data.get('out_of')
                )
            
            return JsonResponse({'success': True})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON data.'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method.'})



def view_student_marks_page(request): 
    return render(request,"teacher/view_student_marks.html")


@login_required
def view_student_marks(request):
    exam_id = request.GET.get('exam_id')

    # Get the class and division of the logged-in class teacher
    class_teacher = get_object_or_404(Class_Teacher, user=request.user)
    class_assigned = class_teacher.class_assigned
    division_assigned = class_teacher.division_assigned

    # Get the students in the assigned class and division
    students = Student.objects.filter(
        class_assigned=class_assigned,
        division_assigned=division_assigned,
        school=class_teacher.school
    )
    
    # Filter subjects by exam, class, and division
    subjects = Subject.objects.filter(
        exam_id=exam_id,
        class_assigned=class_assigned,
        division_assigned=division_assigned
    )

    marks = {}

    # Fetch marks for each student and subject
    for student in students:
        student_marks = {}
        for subject in subjects:
            mark_record = Marks.objects.filter(
                student=student,
                subject=subject,
                exam_id=exam_id
            ).first()
            if mark_record:
                student_marks[subject.subject_id] = f"{mark_record.marks_obtained}/{mark_record.out_of}"
            else:
                student_marks[subject.subject_id] = 'N/A'
        marks[student.id] = student_marks

    # Return the filtered students, subjects, and marks in the response
    return JsonResponse({
        'students': [{'id': student.id, 'name': f"{student.first_name} {student.last_name}"} for student in students],
        'subjects': [{'id': subject.subject_id, 'name': subject.subject_name} for subject in subjects],
        'marks': marks
    })

def view_individual_student_marks(request): 
    return render(request,'teacher/individual_student_mark.html')

# View to fetch students based on the class and division of the logged-in class teacher
def get_students_by_class_teacher(request):
    if request.method == 'GET' and request.user.is_authenticated:
        teacher = request.user.teacher
        class_teacher = get_object_or_404(Class_Teacher, teacher=teacher)
        students = Student.objects.filter(
            class_assigned=class_teacher.class_assigned,
            division_assigned=class_teacher.division_assigned,
            school=class_teacher.school
        )
        students_data = [{'id': student.id, 'first_name': student.first_name, 'last_name': student.last_name} for student in students]
        return JsonResponse({'students': students_data})
    return JsonResponse({'error': 'Unauthorized or Invalid Request'}, status=403)

# View to fetch marks of individual students
def get_student_marks(request):
    if request.method == 'GET' and request.user.is_authenticated:
        student_id = request.GET.get('student_id')
        academic_year = request.GET.get('academic_year')

        student = get_object_or_404(Student, pk=student_id)
        exams = Exam.objects.filter(school=student.school, academic_year=academic_year)
        
        marks_by_exam = {}
        for exam in exams:
            marks = Marks.objects.filter(exam=exam, student=student)
            marks_by_exam[exam.exam_name] = [{
                'subject': mark.subject.subject_name,
                'marks_obtained': mark.marks_obtained,
                'out_of': mark.out_of
            } for mark in marks]

        return JsonResponse({
            'student_name': f'{student.first_name} {student.last_name}',
            'marks_by_exam': marks_by_exam
        })
    return JsonResponse({'error': 'Unauthorized or Invalid Request'}, status=403)

def update_marks_page(request): 
    return render(request,'teacher/update_marks.html')

def check_existing_marks(request):
    if request.method == 'GET':
        exam_id = request.GET.get('exam_id')
        class_assigned = request.GET.get('class_assigned')
        division_assigned = request.GET.get('division_assigned')
        subject_id = request.GET.get('subject_id')
        
        exists = Marks.objects.filter(
            exam_id=exam_id,
            class_assigned=class_assigned,
            division_assigned=division_assigned,
            subject_id=subject_id
        ).exists()
        
        return JsonResponse({'exists': exists})
    
def get_existing_marks(request):
    if request.method == 'GET':
        exam_id = request.GET.get('exam_id')
        class_assigned = request.GET.get('class_assigned')
        division_assigned = request.GET.get('division_assigned')
        subject_id = request.GET.get('subject_id')
        
        marks = Marks.objects.filter(
            exam_id=exam_id,
            class_assigned=class_assigned,
            division_assigned=division_assigned,
            subject_id=subject_id
        ).values('student_id', 'marks_obtained', 'out_of', 'student__first_name', 'student__last_name')
        
        marks_list = [
            {
                'student_id': mark['student_id'],
                'marks_obtained': mark['marks_obtained'],
                'out_of': mark['out_of'],
                'student_name': f"{mark['student__first_name']} {mark['student__last_name']}"
            }
            for mark in marks
        ]
        
        return JsonResponse({'marks': marks_list})
    
@csrf_exempt
@require_POST
def update_marks(request):
    try:
        data = json.loads(request.body)
        logger.debug("Received data: %s", data)  # Log received data

        academic_year = data.get('academic_year')
        exam_id = data.get('exam')
        class_assigned = data.get('class_assigned')
        division_assigned = data.get('division_assigned')
        subject_id = data.get('subject')
        marks_data = data.get('marks_data', [])

        if not all([academic_year, exam_id, class_assigned, division_assigned, subject_id]):
            return JsonResponse({'error': 'Missing parameters'}, status=400)

        for mark_info in marks_data:
            student_id = mark_info.get('student_id')
            marks_obtained = mark_info.get('marks_obtained')
            out_of = mark_info.get('out_of')

            if student_id and (marks_obtained is not None or out_of is not None):
                # Update or create a record
                Marks.objects.update_or_create(
                    exam_id=exam_id,
                    class_assigned=class_assigned,
                    division_assigned=division_assigned,
                    subject_id=subject_id,
                    student_id=student_id,
                    defaults={'marks_obtained': marks_obtained, 'out_of': out_of}
                )

        return JsonResponse({'success': True})

    except json.JSONDecodeError:
        logger.error("Invalid JSON data: %s", request.body)
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        logger.exception("Exception occurred while updating marks: %s", str(e))
        return JsonResponse({'error': str(e)}, status=500)
    

def leave_reason_page(request):
    return render(request,'teacher/leave_reason_page.html')

def add_assignment_page(request): 
    return render(request,'teacher/add_assignment.html')

@login_required
def get_assignment_academic_years(request):
    try:
        # Get the school of the logged-in teacher
        teacher = request.user.teacher
        school = teacher.school

        # Get distinct academic years from assignments linked to the teacher's school
        academic_years = Assignment.objects.filter(school=school).values_list('academic_year', flat=True).distinct()

        return JsonResponse({'academic_years': list(academic_years)})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@csrf_exempt
def add_assignment(request):
    if request.method == 'POST':
        try:
            teacher = request.user.teacher
            school = teacher.school

            subject = request.POST.get('subject')
            class_assigned = request.POST.get('class_assigned')
            division_assigned = request.POST.get('division_assigned')
            title = request.POST.get('title')
            description = request.POST.get('description')
            due_date = request.POST.get('due_date')
            academic_year = request.POST.get('academic_year')

            # Create the assignment
            assignment = Assignment.objects.create(
                school=school,
                teacher=teacher,
                subject=subject,
                class_assigned=class_assigned,
                division_assigned=division_assigned,
                title=title,
                description=description,
                due_date=due_date,
                academic_year=academic_year
            )

            # Create the notification
            AssignmentNotification.objects.create(
                school=school,
                teacher=teacher,
                subject=subject,
                class_assigned=class_assigned,
                division_assigned=division_assigned,
                assignment=assignment
            )

            return JsonResponse({'message': 'Assignment added successfully'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


def view_assignments_page(request):
    return render(request,'teacher/view_assignments.html')

@login_required
def get_teacher_assignments(request):
    if request.user.is_authenticated and hasattr(request.user, 'teacher'):
        teacher = request.user.teacher
        academic_year = request.GET.get('academic_year')

        # Filter assignments by teacher and academic year
        assignments = Assignment.objects.filter(teacher=teacher, academic_year=academic_year).values(
            'assignment_id',
            'title',
            'subject',
            'class_assigned',
            'division_assigned',
            'due_date',
            'description'
        )
        return JsonResponse({'assignments': list(assignments)})
    else:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
def add_assignment_mark(request, assignment_id):
    assignment = get_object_or_404(Assignment, pk=assignment_id)
    return render(request, 'teacher/add_assignment_mark.html', {
        'assignment': assignment,
        'assignment_id': assignment.assignment_id  
    })

def get_assignment_details(request, assignment_id):
    assignment = get_object_or_404(Assignment, pk=assignment_id)
    data = {
        'title': assignment.title,
        'description': assignment.description,
        'class_assigned': assignment.class_assigned,
        'division_assigned': assignment.division_assigned,
        'due_date': assignment.due_date,
    }
    return JsonResponse(data)

@login_required
def get_assignment_students(request, class_assigned, division_assigned, assignment_id):
    if not request.user.is_authenticated or not hasattr(request.user, 'teacher'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    # Get the logged-in teacher's school
    teacher = request.user.teacher
    school = teacher.school

    # Fetch the assignment and verify the school matches
    assignment = get_object_or_404(Assignment, pk=assignment_id, school=school)

    # Filter students by class, division, and school
    students = Student.objects.filter(
        class_assigned=class_assigned,
        division_assigned=division_assigned,
        school=school  # Ensure students belong to the same school as the teacher
    )
    
    student_data = []
    for student in students:
        # Check if a submission exists for the student and assignment
        try:
            submission = StudentAssignmentSubmission.objects.get(student=student, assignment=assignment)
            is_submitted = submission.is_submitted
            marks_obtained = submission.marks_obtained
            total_marks = submission.total_marks
            submission_date = submission.submission_date
        except StudentAssignmentSubmission.DoesNotExist:
            # If no submission exists, return default values
            is_submitted = False
            marks_obtained = None
            total_marks = None
            submission_date = None

        student_data.append({
            'id': student.id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'roll_number': student.roll_number,
            'is_submitted': is_submitted,
            'marks_obtained': marks_obtained,
            'total_marks': total_marks,
            'submission_date': submission_date,
        })

    return JsonResponse({'students': student_data})

@csrf_exempt
def submit_assignment_marks(request, assignment_id):
    if request.method == 'POST':
        data = json.loads(request.body)

        for submission in data['submissions']:
            student = get_object_or_404(Student, pk=submission['student_id'])
            assignment = get_object_or_404(Assignment, pk=assignment_id)

            StudentAssignmentSubmission.objects.update_or_create(
                student=student,
                assignment=assignment,
                defaults={
                    'is_submitted': submission.get('is_submitted', False),
                    'marks_obtained': submission.get('marks_obtained', 0),
                    'total_marks': submission.get('total_marks', 0),
                    'submission_date': submission.get('submission_date'),  # Ensure this is provided
                    'school': assignment.school,
                    'class_assigned': assignment.class_assigned,
                    'division_assigned': assignment.division_assigned,
                }
            )

        return JsonResponse({'message': 'Marks submitted successfully!'})
    return JsonResponse({'error': 'Invalid request method.'}, status=400)