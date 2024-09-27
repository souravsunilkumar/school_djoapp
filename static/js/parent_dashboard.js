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
                $('#guardian_message').text(`You are parent/guardian of ${data.selected_student_name}`);

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
                    } else {
                        redirectUrl = '/parent/assignment_page/';
                    }

                        $('#notification_message').append(`
                        <div class="notification-item">
                            <p>${notification.message}</p>
                            <a href="${redirectUrl}" class="view_notifications_link">View Notification</a>
                        </div>
                    `);
                    });

                    // Show the "Show Earlier Notifications" button if there are more than 5 notifications
                    if (data.notifications.length > 5) {
                        $('#show_more_notifications_btn').show().data('notifications', data.notifications);
                    }
                } else {
                    $('#notification_message').text('No new notifications.');
                }
            },
            error: function (error) {
                console.error('Error fetching notifications:', error);
            }
        });
    });
    // Show earlier notifications when the button is clicked
    $('#show_more_notifications_btn').on('click', function () {
        const allNotifications = $(this).data('notifications');
        $('#notification_message').empty();

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
});
