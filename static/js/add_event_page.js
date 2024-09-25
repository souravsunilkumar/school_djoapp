$(document).ready(function() {
    // Event handler for adding an event
    $('#add_event_btn').on('click', function() {
        const title = $('#title').val();
        const description = $('#description').val();
        const eventDate = $('#event_date').val();
        const featureImage = $('#feature_image')[0].files[0];
        const mediaFiles = $('#media_files')[0].files;
        const youtubeLink = $('#youtube_link').val();
        const csrfToken = $('#csrf_token').val(); // Get CSRF token from the hidden field

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('event_date', eventDate);
        formData.append('feature_image', featureImage);
        formData.append('youtube_link', youtubeLink);
        formData.append('csrfmiddlewaretoken', csrfToken); // Include CSRF token in form data

        // Append media files
        for (let i = 0; i < mediaFiles.length; i++) {
            formData.append('media_files', mediaFiles[i]);
        }

        $.ajax({
            url: '/events/add_event/',  // Adjust this URL to your URL routing
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
                $('#response').html('<p>Event added successfully!</p>');
                $('#addEventForm')[0].reset(); // Clear the form fields
            },
            error: function(response) {
                $('#response').html('<p>Error adding event.</p>');
            }
        });
    });
});
