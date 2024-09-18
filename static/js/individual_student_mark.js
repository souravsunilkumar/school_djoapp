$(document).ready(function () {
    var academicYearSelect = $('#academicYearSelect');
    var studentSelect = $('#studentSelect');
    var studentMarks = $('#studentMarks');

    // Load academic years
    $.ajax({
        url: '/management/get_academic_years/',
        type: 'GET',
        success: function (response) {
            academicYearSelect.empty().append('<option value="" disabled selected>Select Academic Year</option>');
            $.each(response.academic_years, function (index, year) {
                academicYearSelect.append('<option value="' + year + '">' + year + '</option>');
            });
        },
        error: function (xhr, status, error) {
            console.error("Error fetching academic years:", error);
        }
    });

    // Load students based on selected academic year
    academicYearSelect.on('change', function () {
        var academicYear = $(this).val();
        $.ajax({
            url: '/management/get_students_by_class_teacher/',
            data: { academic_year: academicYear },
            type: 'GET',
            success: function (response) {
                studentSelect.empty().append('<option value="" disabled selected>Select Student</option>');
                $.each(response.students, function (index, student) {
                    studentSelect.append('<option value="' + student.id + '">' + student.first_name + ' ' + student.last_name + '</option>');
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching students:", error);
            }
        });
    });

    // Display marks when a student is selected
    studentSelect.on('change', function () {
        var studentId = $(this).val();
        var academicYear = academicYearSelect.val();

        $.ajax({
            url: '/management/get_student_marks/',
            data: {
                student_id: studentId,
                academic_year: academicYear
            },
            type: 'GET',
            success: function (response) {
                studentMarks.empty();
                $.each(response.marks_by_exam, function (exam, marks) {
                    var examSection = '<h3>Marks of ' + exam + ' for ' + response.student_name + ':</h3>';
                    var tableHtml = '<table><thead><tr><th>Subject</th><th>Marks</th></tr></thead><tbody>';

                    $.each(marks, function (index, mark) {
                        tableHtml += '<tr><td>' + mark.subject + '</td><td>' + mark.marks_obtained + '/' + mark.out_of + '</td></tr>';
                    });

                    tableHtml += '</tbody></table>';
                    studentMarks.append(examSection + tableHtml);
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching student marks:", error);
            }
        });
    });
});
