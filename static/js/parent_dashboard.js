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

    // Update guardian message on student change
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

    // Show notification section
    $('#notification_icon').on('click', function () {
        $('#notification_section').toggle(); // Toggle visibility of the notification section

        // Load notifications
        $.ajax({
            url: '/parent/notifications/',
            method: 'GET',
            success: function (data) {
                $('#notification_message').empty();
                if (data.notifications.length > 0) {
                    data.notifications.forEach(function (notification) {
                        $('#notification_message').append(`
                            <div class="notification-item">
                                <p>${notification.message}</p>
                                <button class="give_reason_btn" data-notification-id="${notification.id}" data-student-name="${notification.student_name}" data-date="${notification.date}">Give Reason</button>
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

    // Close notification section when clicking outside of it
    $(window).on('click', function (event) {
        if (!$(event.target).closest('#notification_section, #notification_icon').length) {
            $('#notification_section').hide(); // Hide if click is outside of notification section
        }
    });

    // Mark notifications as read
    function markNotificationsAsRead() {
        $.ajax({
            url: '/parent/mark_notifications_as_read/',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            data: JSON.stringify({
                notification_ids: [] // Include the IDs of notifications if needed
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
        $('#reason_modal_heading').text(`Why was ${studentName} absent on ${date}?`);
        $('#reason_modal').show();
    });

    // Close reason modal
    $('#close_reason_modal_btn').on('click', function () {
        $('#reason_modal').hide();
    });

    // Close modal
    $('#close_modal_btn').on('click', function () {
        $('#attendance_modal').hide();
    });

    // Initial fetch of parent data
    fetchParentData();
});
