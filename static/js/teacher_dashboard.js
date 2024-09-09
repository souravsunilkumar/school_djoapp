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
                            <div class="notification-item ${notification.is_read ? '' : 'unread'}" data-id="${notification.id}">
                                <p>${notification.message}</p>
                                <a href="#" class="view-reason" data-reason="${notification.reason}" data-student="${notification.student}" data-date="${notification.date}">View Reason</a>
                            </div>
                        `;
                        notificationsContainer.append(notificationHtml);
                    });

                    // Add click event listener to view reason in modal
                    $('.view-reason').click(function (e) {
                        e.preventDefault();
                        var reason = $(this).data('reason');
                        var student = $(this).data('student');
                        var date = $(this).data('date');

                        // Display reason in a modal
                        $('#modal-student').text(student);
                        $('#modal-date').text(date);
                        $('#modal-reason').text(reason);

                        // Show modal
                        $('#reason-modal').css('display', 'block');
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

    // Close reason modal
    $('#close_reason_modal').on('click', function () {
        $('#reason-modal').css('display', 'none'); // Hide the reason modal
    });

    function fetchWardens() {
        $.ajax({
            url: '/management/api/get_wardens/',
            type: 'GET',
            success: function (response) {
                if (response.success) {
                    var wardensList = response.wardens;
                    var wardenDropdown = $('#warden');

                    wardenDropdown.empty();
                    wardensList.forEach(function (warden) {
                        wardenDropdown.append('<option value="' + warden.id + '">' + warden.name + '</option>');
                    });
                    wardenDropdown.append('<option value="not_a_hostler">Not a hostler</option>');
                } else {
                    $('#warden').html('<option value="">No wardens found.</option>');
                }
            },
            error: function (error) {
                console.error('Error loading wardens:', error);
                $('#warden').html('<option value="">Error loading wardens.</option>');
            }
        });
    }

    $('#add-student-form').on('submit', function (event) {
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
            success: function (response) {
                if (response.success) {
                    alert('Student added successfully.');
                } else {
                    alert('Failed to add student: ' + response.message);
                }
            },
            error: function (error) {
                alert('There was an error adding the student.');
                console.error(error);
            }
        });
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
                                        <a href="/management/edit_student/${student.id}">Edit</a> |
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
