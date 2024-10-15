$(document).ready(function () {
    function getCSRFToken() {
        const tokenElement = $('[name=csrfmiddlewaretoken]');
        return tokenElement.length ? tokenElement.val() : '';
    }

    // Fetch Parent Data
    function fetchParentData() {
        $.ajax({
            url: '/parent/parent_dashboard_data/',
            method: 'GET',
            success: function (data) {
                $('#parent_name').text(data.parent_name);

                $('#student_select').empty();
                $.each(data.students, function (index, student) {
                    $('#student_select').append(`<option value="${student.id}" ${student.selected ? 'selected' : ''}>${student.first_name} ${student.last_name}</option>`);
                });

                const selectedStudent = $('#student_select option:selected').text();
                $('#guardian_message').text(`You are parent/guardian of ${selectedStudent}`);
            },
            error: function (error) {
                console.error('Error fetching parent data:', error);
            }
        });
    }

    // Fetch Unread Notifications Count
    function fetchUnreadNotificationsCount() {
        $.ajax({
            url: '/parent/unread_notifications_count/',
            method: 'GET',
            success: function (data) {
                const unreadCount = data.unread_count;

                if (unreadCount > 0) {
                    $('#notification_count').text(unreadCount).show();  // Show count if there are unread notifications
                } else {
                    $('#notification_count').hide();  // Hide count if there are no unread notifications
                }
            },
            error: function (error) {
                console.error('Error fetching unread notifications count:', error);
            }
        });
    }

    // Show attendance modal
    $('#view_attendance_btn').on('click', function () {
        $('#attendance_modal').show();
    });

    // Generate Attendance Report
    $('#generate_report_btn').on('click', function () {
        const studentId = $('#student_select').val();
        const fromDate = $('#from_date').val();
        const toDate = $('#to_date').val();

        if (!studentId || !fromDate || !toDate) {
            alert('Please fill in all fields.');
            return;
        }

        $.ajax({
            url: '/parent/attendance_report/',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            data: JSON.stringify({
                student_id: studentId,
                from_date: fromDate,
                to_date: toDate
            }),
            contentType: 'application/json',
            success: function (data) {
                const dates = data.dates;
                const reportBody = data.attendance_records;
                const reasons = data.reasons || {};
                const studentName = data.student_name;

                let headerHtml = '<th>Date</th><th>Status</th><th>Reason</th>';
                let bodyHtml = '';

                dates.forEach(date => {
                    const record = reportBody.find(r => r.date === date);
                    const status = record ? record.status : 'N/A';
                    const reason = status === 'Absent' ? (reasons[date] ? reasons[date] : 'No reason given') : 'N/A';
                    bodyHtml += `<tr><td>${date}</td><td>${status}</td><td>${reason}</td></tr>`;
                });

                $('#report_header').html(headerHtml);
                $('#report_body').html(bodyHtml);
                $('#report_heading').text(`Attendance Report of ${studentName}`);
            },
            error: function (error) {
                console.error('Error generating attendance report:', error);
            }
        });
    });

    // Show notification section and load notifications
    $('#notification_icon').on('click', function () {
        $('#notification_section').toggle(); // Toggle visibility of the notification section

        $.ajax({
            url: '/parent/notifications/',
            method: 'GET',
            success: function (data) {
                $('#notification_message').empty();
                if (data.notifications.length > 0) {
                    const notificationsToShow = data.notifications.slice(0, 5); // Get the last five notifications
                    notificationsToShow.forEach(function (notification) {
                        let redirectUrl;

                        if (notification.is_absent) {
                            redirectUrl = '/parent/absent_page/';
                        } else if (notification.type === 'event') {
                            redirectUrl = '/parent/parent_event_page/'; // Update to point to event page
                        }
                        else if(notification.type=='timetable'){
                            redirectUrl = '/parent/timetables_page/';
                        }
                        else {
                            redirectUrl = '/parent/assignment_page/';
                        }

                        $('#notification_message').append(`
                            <div class="notification-item ${!notification.is_read ? 'unread' : ''}">
                                <p>${notification.message}</p>
                                <a href="#" class="view_notifications_link" data-id="${notification.id}" data-type="${notification.type}">
                                    View Notification
                                </a>
                            </div>
                        `);
                    });

                    // Store all notifications data in the button
                    $('#show_more_notifications_btn').show().data('notifications', data.notifications);

                    // Show the "Show Earlier Notifications" button if there are more than 5 notifications
                    if (data.notifications.length > 5) {
                        $('#show_more_notifications_btn').show();
                    }
                } else {
                    $('#notification_message').text('No new notifications.');
                    $('#show_more_notifications_btn').hide(); // Hide button if no notifications
                }
            },
            error: function (error) {
                console.error('Error fetching notifications:', error);
            }
        });
    });

    // Mark notification as read and redirect on click
    $(document).on('click', '.view_notifications_link', function (e) {
        e.preventDefault(); // Prevent the default link behavior
        const notificationId = $(this).data('id');

        $.ajax({
            url: `/parent/notifications/read/${notificationId}/`,
            method: 'POST',
            data: {
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val() // Include CSRF token
            },
            success: function (data) {
                let redirectUrl;

                // Redirect based on the type received in the response
                if (data.type === 'absence') {
                    redirectUrl = '/parent/absent_page/';
                } else if (data.type === 'event') {
                    redirectUrl = '/parent/parent_event_page/';
                }else if (data.type === 'timetable') {
                    redirectUrl = '/parent/timetables_page/'; 
                }else {
                    redirectUrl = '/parent/assignment_page/';
                }
                window.location.href = redirectUrl; // Redirect to the corresponding page
            },
            error: function (error) {
                console.error('Error marking notification as read:', error);
            }
        });
    });

    // Show earlier notifications when the button is clicked
    $('#show_more_notifications_btn').on('click', function () {
        const allNotifications = $(this).data('notifications'); // Get stored notifications data

        if (!allNotifications) {
            console.error('No notifications available.');
            return; // Prevent further execution if no notifications found
        }

        allNotifications.forEach(function (notification) {
            const redirectUrl = notification.is_absent ? '/parent/absent_page/' : '/parent/assignment_page/';
            $('#notification_message').append(`
            <div class="notification-item">
                <p>${notification.message}</p>
                <a href="${redirectUrl}" class="view_notifications_link">View Notification</a>
            </div>
        `);
        });

        // Hide the button after showing all notifications
        $(this).hide();
    });
    // Close notification section
    $('#close_notification_btn').on('click', function () {
        $('#notification_section').hide();
    });

    // Close attendance modal
    $('#close_modal_btn').on('click', function () {
        $('#attendance_modal').hide();
    });

    // Initial fetch of parent data
    fetchParentData();
    fetchUnreadNotificationsCount();

    // Logout functionality
    $('#logout_button').on('click', function () {
        $.ajax({
            url: '/setup_auth/api/logout/',
            type: 'POST',
            success: function (response) {
                if (response.success) {
                    alert('Logged out successfully.');
                    
                    // Replace current state and redirect to login page
                    window.history.replaceState(null, null, '/'); // Replace history state
                    window.location.href = '/'; // Redirect to the login page
                } else {
                    alert('Logout failed: ' + response.message);
                }
            },
            error: function (error) {
                alert('There was an error during logout.');
                console.error(error);
            }
        });
    });
    
    // Prevent back navigation after logout
    window.addEventListener('popstate', function (event) {
        // Check if the user is logged out
        $.ajax({
            url: '/setup_auth/api/is_logged_in/',  // Create an API endpoint that checks if the user is authenticated
            type: 'GET',
            success: function (response) {
                if (!response.is_authenticated) {
                    // If the user is logged out, redirect to the login page
                    window.location.href = "/";
                }
            },
            error: function (error) {
                console.error('Error checking user authentication status:', error);
            }
        });
    });
});
