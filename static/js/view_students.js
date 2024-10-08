$(document).ready(function () {
    console.log('jQuery is loaded and working');
    function loadTeacherDashboard() {
        $.ajax({
            url: '/management/api/teacher/dashboard/',
            type: 'GET',
            success: function (response) {
                if (response.success) {
                    const data = response.data;
                    $('#welcome-message').text(`Welcome, ${data.teacher_name}`);
                    if (data.is_class_teacher) {
                        $('#class-teacher-status').html(`
                            <p>You are the class teacher for ${data.class_assigned} - ${data.division_assigned}</p>
                        `);
                        $('#students-container').show(); // Show students list container
                        $('#actions').show(); // Show actions section
                        const studentsTableBody = $('#students-table tbody');
                        studentsTableBody.empty(); // Clear existing data
                        data.students.forEach(student => {
                            studentsTableBody.append(`
                                <tr>
                                    <td>${student.roll_number}</td>
                                    <td>${student.first_name}</td>
                                    <td>${student.last_name}</td>
                                    <td>
                                        <a href="/management/edit_student/${student.id}" class="edit-link" >Edit</a> 
                                        <a href="#" class="delete-student" data-id="${student.id}">Delete</a>
                                    </td>
                                </tr>
                            `);
                        });

                        $('.delete-student').click(function (e) {
                            e.preventDefault();
                            var studentId = $(this).data('id');
                            $.ajax({
                                url: '/management/api/delete_student/',
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify({ student_id: studentId }),
                                success: function (response) {
                                    if (response.success) {
                                        location.reload(); // Reload the page after deletion
                                    } else {
                                        alert('Error deleting student.');
                                    }
                                },
                                error: function (error) {
                                    console.error('Error deleting student:', error);
                                }
                            });
                        });
                    } else {
                        $('#class-teacher-status').html('<p>You are not a class teacher.</p>');
                        $('#students-container').hide(); // Hide students list container
                        $('#actions').hide(); // Hide actions section
                    }
                } else {
                    console.error('Failed to load teacher dashboard data:', response.message);
                }
            },
            error: function (error) {
                console.error('Error loading teacher dashboard data:', error);
            }
        });
    }

    loadTeacherDashboard();
});