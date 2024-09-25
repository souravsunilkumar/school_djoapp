$(document).ready(function() {
    const eventId = new URLSearchParams(window.location.search).get('id');

    // Function to fetch event details
    function loadEventDetails(eventId) {
        $.ajax({
            url: `/events/event_details_data/?id=${eventId}`,
            method: 'GET',
            success: function(response) {
                const event = response.event;
                const media = response.media;

                // Populate event details
                $('#event-title').text(event.title);
                $('#event-description').text(event.description);
                $('#event-date').text(`Event Date: ${event.event_date}`);
                $('#feature-image').attr('src', event.feature_image_url);

                // Populate YouTube embedded videos
                const youtubeLinksContainer = $('#youtube-links');
                media.youtube_links.forEach(link => {
                    const videoId = extractYouTubeVideoId(link);
                    youtubeLinksContainer.append(`
                        <div class="youtube-player">
                            <iframe width="560" height="315" 
                                src="https://www.youtube.com/embed/${videoId}?rel=0" 
                                frameborder="0" allowfullscreen>
                            </iframe>
                        </div>
                    `);
                });

                // Populate event images
                const eventImagesContainer = $('#event-images');
                media.images.forEach(image => {
                    eventImagesContainer.append(`<img src="${image}" alt="Event Image" class="event-image" />`);
                });
            },
            error: function(error) {
                console.log('Error fetching event details:', error);
            }
        });
    }

    // Helper function to extract YouTube video ID from URL
    function extractYouTubeVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const matches = url.match(regex);
        return matches ? matches[1] : null;
    }

    // Call the function to load event details when the page is ready
    loadEventDetails(eventId);
});
