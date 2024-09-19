$(document).ready(function () {
    function getCSRFToken() {
        const tokenElement = $('[name=csrfmiddlewaretoken]');
        return tokenElement.length ? tokenElement.val() : '';
    }

    function loadNotifications() {
        $.ajax({
            url: '/parent/notifications/',
            method: 'GET',
            success: function (data) {
                const notificationList = $('#notification_list');
                notificationList.empty();

                if (data.notifications.length > 0) {
                    data.notifications.forEach(function (notification) {
                        const notificationItem = $(`
                            <div class="notification-item">
                                <p>${notification.message}</p>
                                <button class="give_reason_btn" 
                                    data-student-name="${notification.student_name}" 
                                    data-date="${notification.date}" 
                                    data-notification-id="${notification.id}">
                                    Add Reason
                                </button>
                            </div>
                        `);
                        
                        // Check if reason is given for this notification
                        checkReasonGiven(notification.id, notificationItem.find('.give_reason_btn'));

                        notificationList.append(notificationItem);
                    });
                } else {
                    notificationList.append('<p>No new notifications.</p>');
                }
            },
            error: function (error) {
                console.error('Error fetching notifications:', error);
            }
        });
    }

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

    // Show reason modal with scaling effect
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
                $(`button.give_reason_btn[data-notification-id="${notificationId}"]`).text('Reason Given')
                    .removeClass('give_reason_btn')
                    .addClass('reason_given_btn'); // Change class to update button style
            },
            error: function (error) {
                console.error('Error submitting leave reason:', error);
            }
        });
    });

    // Load notifications on page load
    loadNotifications();
});
