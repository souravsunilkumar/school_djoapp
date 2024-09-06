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
                const studentName = data.student_name;

                // Set the table header with dates
                let headerHtml = '<th>Student Name</th>';
                dates.forEach(date => {
                    headerHtml += `<th>${date}</th>`;
                });
                $('#report_header').html(headerHtml);

                // Set the table body with attendance data
                let bodyHtml = `<tr><td>${studentName}</td>`;
                dates.forEach(date => {
                    const record = reportBody.find(r => r.date === date);
                    bodyHtml += `<td>${record ? record.status : 'N/A'}</td>`;
                });
                bodyHtml += '</tr>';
                $('#report_body').html(bodyHtml);

                // Set the report heading
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
                        $('#notification_message').append(`
                            <div class="notification-item" data-notification-id="${notification.id}">
                                <p>${notification.message}</p>
                                <button class="give_reason_btn" data-notification-id="${notification.id}" data-student-name="${notification.student_name}" data-date="${notification.date}" ${notification.reason_given ? 'disabled' : ''}>${notification.reason_given ? 'Reason Given' : 'Give Reason'}</button>
                            </div>
                        `);
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
                $(`button.give_reason_btn[data-notification-id="${notificationId}"]`).text('Reason Given');
            },
            error: function (error) {
                console.error('Error submitting leave reason:', error);
            }
        });
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
