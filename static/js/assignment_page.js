$(document).ready(function () {
    // Load assignment notifications
    function loadAssignmentNotifications() {
        $.ajax({
            url: '/parent/parent_assignment_notifications/',
            method: 'GET',
            success: function (data) {
                const notificationList = $('#assignment_notification_list');
                notificationList.empty();

                if (data.notifications.length > 0) {
                    data.notifications.forEach(function (notification) {
                        const notificationItem = $(`
                            <div class="notification-item">
                                <p>${notification.message}</p>
                                <button class="view-assignment-btn" data-assignment-id="${notification.assignment_id}">
                                    View Assignment
                                </button>
                            </div>
                        `);
                        notificationList.append(notificationItem);
                    });
                } else {
                    notificationList.append('<p>No new assignment notifications.</p>');
                }
            },
            error: function (error) {
                console.error('Error fetching assignment notifications:', error);
            }
        });
    }

    // Show assignment details in modal
    $(document).on('click', '.view-assignment-btn', function () {
        const assignmentId = $(this).data('assignment-id');
        $.ajax({
            url: `/parent/assignment_details/${assignmentId}/`,
            method: 'GET',
            success: function (data) {
                $('#assignment_title').text(data.title);
                $('#assignment_teacher').text(data.teacher);
                $('#assignment_subject').text(data.subject);
                $('#assignment_due_date').text(data.due_date);
                $('#assignment_description').text(data.description);

                // Load student statuses
                loadStudentStatuses(data.students);

                // Show modal only after data is populated
                $('#assignment_detail_modal').fadeIn(300);
            },
            error: function (error) {
                console.error('Error fetching assignment details:', error);
            }
        });
    });

    // Load student statuses
    function loadStudentStatuses(students) {
        const statusesContainer = $('#student_statuses');
        statusesContainer.empty();

        if (Array.isArray(students) && students.length > 0) {
            students.forEach(function (student) {
                const statusClass = student.submitted === 'submitted' ? 'submitted' : 'not-submitted';
                const statusText = `${student.name}: ${student.submitted.charAt(0).toUpperCase() + student.submitted.slice(1)} (Marks: ${student.marks})`;
                statusesContainer.append(`<p class="${statusClass}">${statusText}</p>`);
            });
        } else {
            statusesContainer.append('<p>No students linked.</p>');
        }
    }

    // Close modal
    $('#close_assignment_modal').on('click', function () {
        $('#assignment_detail_modal').fadeOut(300); // Use fade out for smoother UX
    });

    // Load notifications on page load
    loadAssignmentNotifications();
});
