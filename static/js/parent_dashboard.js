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
                        $('#notification_message').append(`
                            <div class="notification-item">
                                <p>${notification.message}</p>
                                <button class="view_notifications_btn" data-notification-id="${notification.id}">View Notifications</button>
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

    // Redirect to absent_page.html when clicking on a notification button
    $(document).on('click', '.view_notifications_btn', function () {
        window.location.href = '/parent/absent_page/';
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

    // Initialize the dashboard data
    fetchParentData();
});
