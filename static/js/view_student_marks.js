$(document).ready(function() {
    var academicYearSelect = $('#academicYearSelect');
    var examSelect = $('#examSelect');
    var marksTableContainer = $('#marksTableContainer');

    // Load academic years
    $.ajax({
        url: '/management/get_academic_years/',
        type: 'GET',
        success: function(response) {
            academicYearSelect.empty().append('<option value="" disabled selected>Select Academic Year</option>');
            $.each(response.academic_years, function(index, year) {
                academicYearSelect.append('<option value="' + year + '">' + year + '</option>');
            });
        },
        error: function(xhr, status, error) {
            console.error("Error fetching academic years:", error);
        }
    });

    // Load exams based on selected academic year
    academicYearSelect.on('change', function() {
        var academicYear = $(this).val();
        $.ajax({
            url: '/management/get_exams/',
            data: { academic_year: academicYear },
            type: 'GET',
            success: function(response) {
                examSelect.empty().append('<option value="" disabled selected>Select Exam</option>');
                $.each(response.exams, function(index, exam) {
                    examSelect.append('<option value="' + exam.exam_id + '">' + exam.exam_name + '</option>');
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching exams:", error);
            }
        });
    });

    // Load marks based on selected exam
    $('#marksFilterForm').on('submit', function(e) {
        e.preventDefault();

        var examId = examSelect.val();
        $.ajax({
            url: '/management/view_student_marks/',
            data: { exam_id: examId },
            type: 'GET',
            success: function(response) {
                var tableHtml = '<table border="1"><thead><tr><th>Student</th>';
                $.each(response.subjects, function(index, subject) {
                    tableHtml += '<th>' + subject.name + '</th>';
                });
                tableHtml += '</tr></thead><tbody>';

                $.each(response.students, function(index, student) {
                    tableHtml += '<tr><td>' + student.name + '</td>';
                    $.each(response.subjects, function(index, subject) {
                        var mark = response.marks[student.id][subject.id] || 'N/A';
                        tableHtml += '<td>' + mark + '</td>';
                    });
                    tableHtml += '</tr>';
                });

                tableHtml += '</tbody></table>';
                marksTableContainer.html(tableHtml);
            },
            error: function(xhr, status, error) {
                console.error("Error fetching student marks:", error);
            }
        });
    });
});
