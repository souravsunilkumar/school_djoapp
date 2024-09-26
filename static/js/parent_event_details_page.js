$(document).ready(function() {
    const eventId = new URLSearchParams(window.location.search).get('event_id');

    // Function to fetch event details
    function loadEventDetails(eventId) {
        $.ajax({
            url: `/parent/get_event_details/${eventId}/`,
            method: 'GET',
            success: function(response) {
                const event = response;
                const media = response.media;

                // Populate event details
                $('#event-title').text(event.title);
                $('#event-description').text(event.description);
                $('#event-date').text(`Event Date: ${event.event_date}`);
                if (event.feature_image) {
                    $('#feature-image').attr('src', event.feature_image).show();
                } else {
                    $('#feature-image').hide();
                }

                // Clear the media containers
                const youtubeContainer = $('#youtube-container');
                const imageGallery = $('#image-gallery');
                youtubeContainer.empty();
                imageGallery.empty();

                // Populate YouTube embedded videos
                media.forEach(mediaItem => {
                    if (mediaItem.type === 'youtube') {
                        const videoId = extractYouTubeVideoId(mediaItem.link);
                        youtubeContainer.append(`
                            <div class="youtube-player" id="player-${videoId}" style="width: 560px; height: 315px;"></div>
                        `);

                        // Load the YouTube Player API
                        if (typeof YT === 'undefined') {
                            const tag = document.createElement('script');
                            tag.src = "https://www.youtube.com/iframe_api";
                            const firstScriptTag = document.getElementsByTagName('script')[0];
                            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                        }

                        // Create a player for each video
                        window.onYouTubeIframeAPIReady = function() {
                            new YT.Player(`player-${videoId}`, {
                                height: '315',
                                width: '560',
                                videoId: videoId,
                                playerVars: {
                                    'autoplay': 1, // Start playing the video automatically
                                    'controls': 1
                                },
                                events: {
                                    'onReady': function(event) {
                                        // Optionally, you can call playVideo() here if needed
                                        event.target.playVideo(); // Uncomment if you want to force play
                                    }
                                }
                            });
                        };
                    }
                });

                // Populate event images
                media.forEach(mediaItem => {
                    if (mediaItem.type === 'file') {
                        imageGallery.append(`<img src="${mediaItem.file}" alt="Event Image" class="event-media-image" />`);
                    }
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
