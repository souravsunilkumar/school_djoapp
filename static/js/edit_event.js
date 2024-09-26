$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        alert("Event ID is missing. Please check the URL.");
        return; // Exit if no event ID is found
    }

    // Fetch event details
    $.ajax({
        url: `/events/get_event_details/${eventId}/`,
        method: 'GET',
        success: function(event) {
            // Populate the form fields with event data
            $('#event-id').val(event.event_id);
            $('#title').val(event.title);
            $('#description').val(event.description);
            $('#event-date').val(event.event_date);
            if (event.feature_image_url) {
                $('#feature-image').before(`<img src="${event.feature_image_url}" alt="Feature Image" style="max-width: 200px; margin-bottom: 10px;">`);
            }
            // Populate existing media
            if (event.media_files) {
                event.media_files.forEach(function(media) {
                    const mediaUrl = `/media/${media.media_file}`; // Construct the full URL for media files
                    $('#media-list').append(`
                        <li>
                            <img src="${mediaUrl}" alt="Media Image" style="max-width: 100px; margin-right: 10px;">
                            <input type="url" class="youtube-link" placeholder="YouTube Link" value="${media.youtube_link || ''}"> <!-- Populate YouTube link -->
                            <button class="delete-media" data-media-id="${media.id}">Delete</button>
                        </li>
                    `);
                });
            }
        },
        error: function() {
            alert('Error loading event details. Please try again.');
        }
    });

    // Handle form submission
    $('#edit-event-form').on('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();

        // Gather YouTube links to include in the form data
        const youtubeLinks = [];
        $('.youtube-link').each(function() {
            youtubeLinks.push($(this).val());
        });

        formData.append('youtube_links', JSON.stringify(youtubeLinks)); // Append YouTube links to FormData

        $.ajax({
            url: `/events/update_event/${eventId}/`,
            method: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                'X-CSRFToken': csrfToken
            },
            success: function() {
                alert('Event updated successfully!');
                window.location.href = '/events/events_page';  // Redirect to event page
            },
            error: function(xhr) {
                alert('Error updating event: ' + xhr.responseText);
            }
        });
    });

    // Handle deletion of media
    $(document).on('click', '.delete-media', function() {
        const mediaId = $(this).data('media-id');
        $.ajax({
            url: `/events/delete_media/${mediaId}/`,  // Endpoint to delete media
            method: 'POST',
            data: {
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function() {
                alert('Media deleted successfully!');
                location.reload(); // Reload the page to see the changes
            },
            error: function(xhr) {
                alert('Error deleting media: ' + xhr.responseText);
            }
        });
    });
});
