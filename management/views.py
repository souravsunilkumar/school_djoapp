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

            teachers = Teacher.objects.filter(school=school).values(
                "id", "first_name", "last_name"
            )
            teachers_list = [
                {
                    "id": teacher["id"],
                    "full_name": f"{teacher['first_name']} {teacher['last_name']}",
                }
                for teacher in teachers
            ]

            return JsonResponse({"teachers": teachers_list})
        except School_admin.DoesNotExist:
            return JsonResponse({"error": "School admin not found."})
        except Exception as e:
            return JsonResponse({"error": str(e)})

    return JsonResponse({"error": "Invalid request method."})


def teacher_dashboard(request):
    """Render the teacher dashboard."""
    return render(request, "teacher_dashboard.html")


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


def get_exams(request):
    if request.user.is_authenticated:
        teacher = request.user.teacher  # Assuming there's a teacher relation
        exams = Exam.objects.filter(
            school=teacher.school
        )  # Filter exams by the teacher's school
        exams_data = [{"id": exam.exam_id, "name": exam.exam_name} for exam in exams]
        return JsonResponse({"exams": exams_data})
    return JsonResponse({"error": "Unauthorized"}, status=403)


def add_exam_or_select(request):
    if request.method == "POST":
        exam_name = request.POST.get("exam_name")
        exam_id = request.POST.get("exam_id")

        if exam_id:
            try:
                exam = Exam.objects.get(id=exam_id)
                return JsonResponse(
                    {"message": f'Exam "{exam.exam_name}" selected successfully.'}
                )
            except Exam.DoesNotExist:
                return JsonResponse({"error": "Exam not found."}, status=404)

        if exam_name:
            teacher = request.user.teacher
            exam = Exam.objects.create(exam_name=exam_name, school=teacher.school)
            return JsonResponse({"message": f'Exam "{exam_name}" added successfully.'})

        return JsonResponse({"error": "No exam selected or added."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)


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


def add_subject(request):
    if request.method == "POST":
        subject_name = request.POST.get("subject_name")
        class_id = request.POST.get("class_id")
        division_id = request.POST.get("division_id")
        exam_id = request.POST.get("exam_id")
        teacher = request.user.teacher  # Assuming a related teacher object for the logged-in user

        if subject_name and class_id and division_id and exam_id:
            # Get the school from the logged-in teacher
            school = teacher.school
            username = request.user.username  # Get the username of the logged-in teacher

            # Now, create the subject and include the school and username
            subject = Subject.objects.create(
                subject_name=subject_name,
                class_assigned=class_id,
                division_assigned=division_id,
                teacher=teacher,
                exam_id=exam_id,
                school=school,  # Set the school field
                user_name=username  # Set the user_name field to the logged-in teacher's username
            )
            return JsonResponse({"message": f'Subject "{subject_name}" added successfully.'})

        return JsonResponse({"error": "All fields are required."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)

def add_marks_page(request):
    return render(request,'teacher/add_marks.html')

def get_subjects(request):
    if request.method == 'GET':
        exam_id = request.GET.get('exam_id')
        class_assigned = request.GET.get('class_assigned')
        division_assigned = request.GET.get('division_assigned')
        
        teacher = request.user.teacher
        subjects = Subject.objects.filter(
            exam_id=exam_id,
            class_assigned=class_assigned,
            division_assigned=division_assigned,
            school=teacher.school
        )
        
        subjects_data = [{"id": subj.id, "subject_name": subj.subject_name} for subj in subjects]
        return JsonResponse({"subjects": subjects_data})
    return JsonResponse({"error": "Invalid request method."}, status=405)


def get_students(request):
    if request.method == 'GET':
        exam_id = request.GET.get('exam_id')
        class_assigned = request.GET.get('class_assigned')
        division_assigned = request.GET.get('division_assigned')
        subject_id = request.GET.get('subject_id')
        
        students = Student.objects.filter(
            class_assigned=class_assigned,
            division_assigned=division_assigned,
            school=request.user.teacher.school
        )
        
        students_data = [{"id": student.id, "roll_number": student.roll_number, "first_name": student.first_name, "last_name": student.last_name} for student in students]
        return JsonResponse({"students": students_data})
    return JsonResponse({"error": "Invalid request method."}, status=405)

def add_marks(request):
    if request.method == 'POST':
        exam_id = request.POST.get('exam_id')
        class_assigned = request.POST.get('class_assigned')
        division_assigned = request.POST.get('division_assigned')
        subject_id = request.POST.get('subject_id')
        marks_data = request.POST.get('marks')
        
        marks_list = json.loads(marks_data)
        teacher = request.user.teacher
        for mark in marks_list:
            Marks.objects.create(
                school=teacher.school,
                teacher=teacher,
                class_assigned=class_assigned,
                division_assigned=division_assigned,
                exam_id=exam_id,
                student_id=mark['student_id'],
                subject_id=subject_id,
                marks_obtained=mark['marks_obtained'],
                out_of=mark['out_of']
            )
        return JsonResponse({"success": True})
    return JsonResponse({"error": "Invalid request method."}, status=405)

def view_student_marks_page(request): 
    return render(request,'teacher/view_student_marks.html')

def get_student_marks(request):
    exam_id = request.GET.get('exam_id')
    if not exam_id:
        return JsonResponse({'error': 'Exam ID not provided'}, status=400)
    
    # Get the class teacher for the logged-in user
    try:
        class_teacher = Class_Teacher.objects.get(user=request.user)
    except Class_Teacher.DoesNotExist:
        return JsonResponse({'error': 'Class teacher not found'}, status=404)

    class_assigned = class_teacher.class_assigned
    division_assigned = class_teacher.division_assigned

    # Filter marks based on class_teacher details
    marks_data = Marks.objects.filter(
        exam_id=exam_id,
        student__class_assigned=class_assigned,
        student__division_assigned=division_assigned
    ).select_related('student', 'subject').values(
        'student__first_name', 'student__last_name', 'subject__subject_name', 'marks_obtained','out_of'
    )
    
    result = {}
    for mark in marks_data:
        student_name = f"{mark['student__first_name']} {mark['student__last_name']}"
        subject_name = mark['subject__subject_name']
        marks_obtained = mark['marks_obtained']
        
        if student_name not in result:
            result[student_name] = {}
        result[student_name][subject_name] = marks_obtained
    
    return JsonResponse(result)