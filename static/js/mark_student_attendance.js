$(document).ready(function() {
    function loadStudents(date) {
        $.ajax({
            url: '/attendance/api/get_students/',
            type: 'GET',
            data: { 'attendance_date': date },
            success: function(response) {
                if (response.success) {
                    var studentsTbody = $('#students-tbody');
                    studentsTbody.empty();
                    response.students.forEach(function(student) {
                        studentsTbody.append(`
                            <tr>
                                <td>${student.roll_number}</td>
                                <td>${student.first_name}</td>
                                <td>${student.last_name}</td>
                                <td><input type="radio" name="status_${student.id}" value="present" ${student.is_present ? 'checked' : ''}></td>
                                <td><input type="radio" name="status_${student.id}" value="absent" ${!student.is_present ? 'checked' : ''}></td>
                            </tr>
                        `);
                    });
                } else {
                    alert('Error loading students: ' + response.error_message);
                }
            },
            error: function(error) {
                console.error('Error loading students:', error);
                alert('There was an error loading students.');
            }
        });
    }

    function getTodayDate() {
        var today = new Date();
        return today.toISOString().split('T')[0];
    }

    $('#attendance_date').val(getTodayDate());

    $('#attendance_date').change(function() {
        var selectedDate = $(this).val();
        loadStudents(selectedDate);
    });

    $('#attendance-form').on('submit', function(event) {
        event.preventDefault();
        var formData = {};
        var attendanceDate = $('#attendance_date').val();
        formData['attendance_date'] = attendanceDate;
        formData['students'] = [];

        $('#students-tbody tr').each(function() {
            var studentId = $(this).find('input[type="radio"]').attr('name').split('_')[1];
            var status = $(this).find('input[type="radio"]:checked').val();
            formData['students'].push({
                'student_id': studentId,
                'status': status
            });
        });

        $.ajax({
            url: '/attendance/api/mark_student_attendance/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    alert('Attendance marked successfully.');
                    window.location.href = '/management/teacher_dashboard/';
                } else {
                    alert('Failed to mark attendance: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error marking the attendance.');
                console.error(error);
            }
        });
    });

    // Load students for the current date on page load
    loadStudents(getTodayDate());
});
