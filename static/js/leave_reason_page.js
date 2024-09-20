$(document).ready(function () {
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
                                <p>${notification.message}</p>
                                <a href="#" class="view-reason" data-id="${notification.id}" data-student="${notification.student}" data-date="${notification.date}" data-reason="${notification.reason}">View Reason</a>
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

    // Close reason modal
    $('#close_reason_modal').on('click', function () {
        $('#reason-modal').css('display', 'none'); // Hide the reason modal
    });

    // Load notifications when page is ready
    fetchNotifications();
});
