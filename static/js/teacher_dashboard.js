$(document).ready(function() {
    function fetchNotifications() {
        $.ajax({
            url: '/management/api/notifications/',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    var notificationsList = response.notifications;
                    var notificationsContainer = $('#notifications-container');

                    notificationsContainer.empty();
                    notificationsList.forEach(function(notification) {
                        var notificationHtml = `
                            <div class="notification-item ${notification.is_read ? '' : 'unread'}">
                                <p>${notification.message}</p>
                                <a href="/management/view_leave_reason/${notification.id}" class="view-reason">View Reason</a>
                            </div>
                        `;
                        notificationsContainer.append(notificationHtml);
                    });
                } else {
                    $('#notifications-container').html('<p>No notifications available.</p>');
                }
            },
            error: function(error) {
                console.error('Error loading notifications:', error);
                $('#notifications-container').html('<p>Error loading notifications.</p>');
            }
        });
    }

    fetchNotifications();
    


    function fetchWardens() {
        $.ajax({
            url: '/management/api/get_wardens/',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    var wardensList = response.wardens;
                    var wardenDropdown = $('#warden');

                    wardenDropdown.empty();
                    wardensList.forEach(function(warden) {
                        wardenDropdown.append('<option value="' + warden.id + '">' + warden.name + '</option>');
                    });
                    wardenDropdown.append('<option value="not_a_hostler">Not a hostler</option>');
                } else {
                    $('#warden').html('<option value="">No wardens found.</option>');
                }
            },
            error: function(error) {
                console.error('Error loading wardens:', error);
                $('#warden').html('<option value="">Error loading wardens.</option>');
            }
        });
    }

    $('#add-student-form').on('submit', function(event) {
        event.preventDefault();
        var studentData = {
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            gender: $('#gender').val(),
            admission_number: $('#admission_number').val(),
            roll_number: $('#roll_number').val(),
            parents_number: $('#parents_number').val(),
            parents_email: $('#parents_email').val(),
            warden: $('#warden').val()
        };
        $.ajax({
            url: '/management/api/add_student/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(studentData),
            success: function(response) {
                if (response.success) {
                    alert('Student added successfully.');
                } else {
                    alert('Failed to add student: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error adding the student.');
                console.error(error);
            }
        });
    });

    function loadTeacherDashboard() {
        $.ajax({
            url: '/management/api/teacher/dashboard/',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    const data = response.data;
                    $('#welcome-message').text(`Welcome, ${data.is_class_teacher ? 'Class Teacher' : 'Teacher'}`);
                    if (data.is_class_teacher) {
                        $('#class-teacher-status').html(`
                            <p>You are the class teacher for ${data.class_assigned} - ${data.division_assigned}</p>
                        `);
                        const studentsTableBody = $('#students-table tbody');
                        studentsTableBody.empty();
                        data.students.forEach(function(student) {
                            studentsTableBody.append(`
                                <tr>
                                    <td>${student.roll_number}</td>
                                    <td>${student.first_name}</td>
                                    <td>${student.last_name}</td>
                                    <td>
                                        <a href="/management/edit_student/${student.id}">Edit</a> | 
                                        <a href="#" class="delete-student" data-id="${student.id}">Delete</a>
                                    </td>
                                </tr>
                            `);
                        });
                    } else {
                        $('#class-teacher-status').html('<p>You are not a class teacher.</p>');
                        $('#students-container').hide();
                    }
                } else {
                    $('#welcome-message').text('Error loading dashboard data.');
                }
            },
            error: function(error) {
                console.error('Error loading dashboard:', error);
                $('#welcome-message').text('Error loading dashboard data.');
            }
        });
    }

    loadTeacherDashboard();

    $('#students-table').on('click', '.delete-student', function(event) {
        event.preventDefault();
        var studentId = $(this).data('id');
        if (confirm('Are you sure you want to delete this student?')) {
            $.ajax({
                url: '/management/api/delete_student/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ student_id: studentId }),
                success: function(response) {
                    if (response.success) {
                        alert('Student deleted successfully.');
                        loadTeacherDashboard(); // Reload the student list
                    } else {
                        alert('Failed to delete student: ' + response.message);
                    }
                },
                error: function(error) {
                    alert('There was an error deleting the student.');
                    console.error(error);
                }
            });
        }
    });
});
