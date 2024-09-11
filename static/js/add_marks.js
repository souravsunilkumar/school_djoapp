$(document).ready(function () {
    // Utility function to get CSRF token from the form
    function getCSRFToken() {
        return $('input[name="csrfmiddlewaretoken"]').val();
    }

    // Fetch exams
    function fetchExams() {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_exams/', // Your endpoint to get the exams
            success: function (response) {
                var exams = response.exams;
                var examDropdown = $('#exam_select');
                examDropdown.empty().append('<option value="">Select Exam</option>');

                exams.forEach(function (exam) {
                    examDropdown.append('<option value="' + exam.id + '">' + exam.name + '</option>');
                });
            },
            error: function (xhr, status, error) {
                alert('Error fetching exams.');
            }
        });
    }

    // Fetch classes and divisions
    function fetchClassesAndDivisions() {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_classes_and_divisions/',
            success: function (response) {
                var classes = response.classes;
                var classDropdown = $('#class_select');
                classDropdown.empty().append('<option value="">Select Class</option>');

                classes.forEach(function (cls) {
                    classDropdown.append('<option value="' + cls.class_assigned + '">' + cls.class_assigned + '</option>');
                });
            },
            error: function (xhr, status, error) {
                alert('Error fetching classes.');
            }
        });
    }

    // Fetch divisions based on selected class
    function fetchDivisions(classAssigned) {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_classes_and_divisions/',
            data: { class_id: classAssigned },
            success: function (response) {
                var divisions = response.divisions;
                var divisionDropdown = $('#division_select');

                divisionDropdown.empty().append('<option value="">Select Division</option>');

                divisions.forEach(function (div) {
                    divisionDropdown.append('<option value="' + div.division_assigned + '">' + div.division_assigned + '</option>');
                });
            },
            error: function (xhr, status, error) {
                alert('Error fetching divisions.');
            }
        });
    }

    // Fetch subjects based on exam, class, and division
    function fetchSubjects(examId, classAssigned, divisionAssigned) {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_subjects/', // Add this URL in your urls.py
            data: {
                exam_id: examId,
                class_assigned: classAssigned,
                division_assigned: divisionAssigned
            },
            success: function (response) {
                var subjects = response.subjects;
                var subjectDropdown = $('#subject_select');
                subjectDropdown.empty().append('<option value="">Select Subject</option>');

                subjects.forEach(function (subj) {
                    subjectDropdown.append('<option value="' + subj.id + '">' + subj.subject_name + '</option>');
                });
                $('#marks_section').hide();
            },
            error: function (xhr, status, error) {
                alert('Error fetching subjects.');
            }
        });
    }

    // Fetch students based on selected subject
    function fetchStudents(examId, classAssigned, divisionAssigned, subjectId) {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_students/', // Add this URL in your urls.py
            data: {
                
                exam_id: examId,
                class_assigned: classAssigned,
                division_assigned: divisionAssigned,
                subject_id: subjectId
            },
            success: function (response) {
                var students = response.students;
                var tableBody = $('#marks_table tbody');
                tableBody.empty();

                students.forEach(function (student) {
                    tableBody.append(
                        '<tr>' +
                        '<td>' + student.roll_number + '</td>' +
                        '<td>' + student.first_name + ' ' + student.last_name + '</td>' +
                        '<td><input type="number" class="marks_obtained" data-student-id="' + student.id + '"></td>' +
                        '</tr>'
                    );
                });
                $('#marks_section').show();
            },
            error: function (xhr, status, error) {
                alert('Error fetching students.');
            }
        });
    }

    // Load exams on page load
    fetchExams();
    fetchClassesAndDivisions();

    // Fetch divisions when class is selected
    $('#class_select').on('change', function () {
        var selectedClass = $(this).val();
        if (selectedClass) {
            fetchDivisions(selectedClass);
        } else {
            $('#division_select').empty().append('<option value="">Select Division</option>');
        }
    });

    // Fetch subjects when exam, class, and division are selected
    $('#exam_select, #class_select, #division_select').on('change', function () {
        var examId = $('#exam_select').val();
        var classAssigned = $('#class_select').val();
        var divisionAssigned = $('#division_select').val();

        if (examId && classAssigned && divisionAssigned) {
            fetchSubjects(examId, classAssigned, divisionAssigned);
        }
    });

    // Fetch students when subject is selected
    $('#subject_select').on('change', function () {
        var examId = $('#exam_select').val();
        var classAssigned = $('#class_select').val();
        var divisionAssigned = $('#division_select').val();
        var subjectId = $(this).val();

        if (examId && classAssigned && divisionAssigned && subjectId) {
            fetchStudents(examId, classAssigned, divisionAssigned, subjectId);
        }
    });

    // Submit marks
    $('#submit_marks').on('click', function () {
        var examId = $('#exam_select').val();
        var classAssigned = $('#class_select').val();
        var divisionAssigned = $('#division_select').val();
        var subjectId = $('#subject_select').val();
        var totalMarks = $('#total_marks').val();
        var marksData = [];

        $('#marks_table tbody tr').each(function () {
            var studentId = $(this).find('.marks_obtained').data('student-id');
            var marksObtained = $(this).find('.marks_obtained').val();
            if (studentId && marksObtained) {
                marksData.push({
                    student_id: studentId,
                    marks_obtained: marksObtained,
                    out_of: totalMarks
                });
            }
        });

        $.ajax({
            type: 'POST',
            url: '/management/exam/add_marks/', // Add this URL in your urls.py
            data: {
                exam_id: examId,
                class_assigned: classAssigned,
                division_assigned: divisionAssigned,
                subject_id: subjectId,
                marks: JSON.stringify(marksData),
                'csrfmiddlewaretoken': getCSRFToken()
            },
            success: function (response) {
                alert('Marks added successfully.');
            },
            error: function (xhr, status, error) {
                alert('Error adding marks.');
            }
        });
    });
});
