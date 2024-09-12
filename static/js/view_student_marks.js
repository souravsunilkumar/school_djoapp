$(document).ready(function () {
    // Populate exams dropdown
    $.ajax({
        type: 'GET',
        url: '/management/exam/get_exams/', // Endpoint to get list of exams
        success: function (response) {
            var $examSelect = $('#exam_select');
            $examSelect.empty();
            $examSelect.append('<option value="">Select Exam</option>');
            $.each(response.exams, function (index, exam) {
                $examSelect.append('<option value="' + exam.id + '">' + exam.name + '</option>');
            });
        },
        error: function (xhr, status, error) {
            alert('Error fetching exams.');
        }
    });

    // Fetch marks when button is clicked
    $('#fetch_marks').on('click', function () {
        var examId = $('#exam_select').val();
        if (!examId) {
            alert('Please select an exam.');
            return;
        }

        $.ajax({
            type: 'GET',
            url: '/management/view_student_marks/',
            data: { 'exam_id': examId },
            success: function (response) {
                populateMarksTable(response);
            },
            error: function (xhr, status, error) {
                alert('Error fetching student marks.');
            }
        });
    });

    function populateMarksTable(data) {
        var tableHead = $('#marks_table thead tr');
        var tableBody = $('#marks_table tbody');
        
        tableHead.find('th:gt(0)').remove(); // Remove existing subject columns
        tableBody.empty(); // Clear existing rows
        
        var subjects = new Set();
        var rows = {};

        // Collect subject names and student rows
        for (var student in data) {
            if (!rows[student]) {
                rows[student] = {};
            }
            for (var subject in data[student]) {
                subjects.add(subject);
                rows[student][subject] = data[student][subject];  // Store marks as marks_obtained/out_of
            }
        }

        // Add subjects to the table header
        subjects = Array.from(subjects);
        subjects.forEach(function (subject) {
            tableHead.append('<th>' + subject + '</th>');
        });

        // Add student rows to the table body
        for (var student in rows) {
            var studentRow = '<tr><td>' + student + '</td>';
            subjects.forEach(function (subject) {
                var mark = rows[student][subject] || 'N/A';  // Get marks_obtained/out_of or show N/A
                studentRow += '<td>' + mark + '</td>';
            });
            studentRow += '</tr>';
            tableBody.append(studentRow);
        }
    }
});