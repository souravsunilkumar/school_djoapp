$(document).ready(function () {
    console.log('jQuery is loaded and working');

    function fetchNotifications() {
        $.ajax({
            url: '/management/notifications/',  // URL for fetching notifications
            type: 'GET',
            success: function (response) {
                var notificationsContainer = $('#notifications-container');
    
                if (response.success && response.notifications.length > 0) {
                    var notificationsList = response.notifications;
                    notificationsContainer.empty();  // Clear previous notifications
    
                    notificationsList.forEach(function (notification) {
                        var notificationHtml = `
                            <div class="notification-item ${notification.is_read ? '' : 'unread'}">
                                <a href="/management/leave_reason_page" class="notification-link">
                                    <p>${notification.message}</p>
                                </a>
                            </div>
                        `;
                        // Prepend the notification to show the latest at the top
                        notificationsContainer.prepend(notificationHtml);
                    });
                } else {
                    notificationsContainer.html('<p>No notifications available.</p>');
                }
            },
            error: function (error) {
                console.error('Error loading notifications:', error);
                $('#notifications-container').html('<p>Error loading notifications.</p>');
            }
        });
    }
    // Show notification modal
    $('#notification_icon').on('click', function () {
        $('#notification_modal').css('display', 'block'); // Show the notification modal
        fetchNotifications(); // Refresh notifications when modal is opened
    });

    // Close notification modal
    $('#close_modal_btn').on('click', function () {
        $('#notification_modal').css('display', 'none'); // Hide the notification modal
    });

    // Hide notification modal when clicking outside of it
    $(window).on('click', function (event) {
        if (!$(event.target).closest('#notification_modal, #notification_icon').length) {
            $('#notification_modal').css('display', 'none'); // Hide the modal if the click is outside
        }
    });

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

    $('#logout_button').on('click', function() {
        $.ajax({
            url: '/setup_auth/api/logout/',
            type: 'POST',
            success: function(response) {
                if (response.success) {
                    alert('Logged out successfully.');
                    window.location.href = '/'; // Redirect to the login page
                } else {
                    alert('Logout failed: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error during logout.');
                console.error(error);
            }
        });
    });
});
