$(document).ready(function () {
    // Utility function to get CSRF token
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

                // Update the guardian message with the selected student's name
                const selectedStudent = $('#student_select option:selected').text();
                $('#guardian_message').text(`You are parent/guardian of ${selectedStudent}`);
            },
            error: function (error) {
                console.error('Error fetching parent data:', error);
            }
        });
    }

    // Update guardian message when student selection changes
    $('#student_select').on('change', function () {
        const selectedStudent = $(this).find('option:selected').text();
        $('#guardian_message').text(`You are parent/guardian of ${selectedStudent}`);
    });

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
                const reasons = data.reasons || {}; // Assuming `reasons` is returned with the response
                const studentName = data.student_name;

                // Transpose the table
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
                    data.notifications.forEach(function (notification) {
                        const buttonText = notification.reason_given ? 'Reason Given' : 'Give Reason';
                        const buttonClass = notification.reason_given ? 'reason_given_btn' : 'give_reason_btn';

                        $('#notification_message').append(`
                        <div class="notification-item" data-notification-id="${notification.id}">
                            <p>${notification.message}</p>
                            <button class="${buttonClass}" data-notification-id="${notification.id}" data-student-name="${notification.student_name}" data-date="${notification.date}">${buttonText}</button>
                        </div>
                    `);

                        // Check if the reason has already been given for this notification
                        checkReasonGiven(notification.id, $(`button[data-notification-id="${notification.id}"]`));
                    });
                } else {
                    $('#notification_message').text('No new notifications.');
                }
            },
            error: function (error) {
                console.error('Error fetching notifications:', error);
            }
        });
    });

    function checkReasonGiven(notificationId, button) {
        $.ajax({
            url: '/parent/check_reason_given/',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            data: JSON.stringify({
                notification_id: notificationId
            }),
            contentType: 'application/json',
            success: function (data) {
                if (data.reason_given) {
                    button.text('Reason Given').removeClass('give_reason_btn').addClass('reason_given_btn');
                }
            },
            error: function (error) {
                console.error('Error checking reason status:', error);
            }
        });
    }

    // Close notification section
    $('#close_notification_btn').on('click', function () {
        $('#notification_section').hide(); // Hide the notification section
    });

    // Hide notification section when clicking outside of it
    $(window).on('click', function (event) {
        if (!$(event.target).closest('#notification_section, #notification_icon').length) {
            $('#notification_section').hide(); // Hide if click is outside the notification section
        }
    });

    // Mark notifications as read
    function markNotificationsAsRead(notificationIds) {
        $.ajax({
            url: '/parent/mark_notifications_as_read/',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            data: JSON.stringify({
                notification_ids: notificationIds // Send the IDs of notifications to be marked as read
            }),
            contentType: 'application/json',
            success: function (data) {
                console.log('Notifications marked as read.');
            },
            error: function (error) {
                console.error('Error marking notifications as read:', error);
            }
        });
    }

    // Show reason modal
    $(document).on('click', '.give_reason_btn', function () {
        const studentName = $(this).data('student-name');
        const date = $(this).data('date');
        const notificationId = $(this).data('notification-id');

        if (!notificationId) {
            alert('Notification ID is missing.');
            return;
        }

        $('#reason_modal').data('notification-id', notificationId);

        // Update the modal heading with the student's name and date
        $('#reason_modal_heading').text(`Why was ${studentName} absent on ${date}?`);

        // Center and show the modal
        $('#reason_modal').css({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1)', // Full size
            opacity: 1
        }).show();

        // Show the modal overlay
        $('#reason_modal_overlay').show();
    });

    // Close reason modal
    $('#close_reason_modal_btn').on('click', function () {
        $('#reason_modal').hide();
        $('#reason_modal_overlay').hide();
    });

    // Submit leave reason
    $('#submit_reason_btn').on('click', function () {
        const notificationId = $('#reason_modal').data('notification-id');
        const reason = $('#reason_textarea').val().trim();

        if (!notificationId || !reason) {
            alert('Please provide a reason.');
            return;
        }

        $.ajax({
            url: '/parent/submit_leave_reason/',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            data: JSON.stringify({
                notification_id: notificationId,
                reason: reason
            }),
            contentType: 'application/json',
            success: function (data) {
                alert('Reason submitted successfully!');
                $('#reason_modal').hide();
                $('#reason_modal_overlay').hide();

                // Mark notification as read and update button text
                markNotificationsAsRead([notificationId]);
                $(`button.give_reason_btn[data-notification-id="${notificationId}"]`).text('Reason Given')
                    .removeClass('give_reason_btn')
                    .addClass('reason_given_btn'); // Change class to update button style
            },
            error: function (error) {
                console.error('Error submitting leave reason:', error);
            }
        });
    });

    

    // Style for "Reason Given" button
    $(document).on('click', '.give_reason_btn', function () {
        const studentName = $(this).data('student-name');
        const date = $(this).data('date');
        const notificationId = $(this).data('notification-id');

        if (!notificationId) {
            alert('Notification ID is missing.');
            return;
        }

        $('#reason_modal').data('notification-id', notificationId);

        // Update the modal heading with the student's name and date
        $('#reason_modal_heading').text(`Why was ${studentName} absent on ${date}?`);

        // Center the modal
        $('#reason_modal').css({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1)', // Full size
            opacity: 1
        }).show();

        // Show the modal overlay
        $('#reason_modal_overlay').show();
    });

    // Close modal if clicked outside
    $(window).on('click', function (event) {
        if ($(event.target).is('#reason_modal_overlay')) {
            $('#reason_modal').hide();
            $('#reason_modal_overlay').hide();
        }
    });

    // Fetch initial data
    fetchParentData();
});
