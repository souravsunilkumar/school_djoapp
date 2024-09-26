$(document).ready(function () {
    function loadEventBanners() {
        $.ajax({
            url: '/parent/get_event_banners/',
            method: 'GET',
            success: function (response) {
                const eventsContainer = $('#events-container');
                eventsContainer.empty();  // Clear previous content
                
                const schoolEvents = response.school_events;
                
                // Loop through each school
                schoolEvents.forEach(function (schoolEvent) {
                    eventsContainer.append(`<h2>Events of ${schoolEvent.school_name} - School of ${schoolEvent.student_name}</h2>`);
                    
                    schoolEvent.events.forEach(function (event) {
                        let bannersHtml = '<div class="event-banners">';
                        event.banners.forEach(function (banner) {
                            bannersHtml += `
                                <div class="banner-card" data-event-id="${event.event_id}">
                                    <img src="${banner.banner_image}" alt="${banner.banner_title}" class="banner-image">
                                    <p class="banner-title">${banner.banner_title}</p>
                                </div>
                            `;
                        });
                        bannersHtml += '</div>';
                        
                        eventsContainer.append(`
                            <h3>${event.event_title} (${event.event_date})</h3>
                            ${bannersHtml}
                        `);
                    });
                });

                // Redirect to event details on banner click
                $('.banner-card').click(function () {
                    const eventId = $(this).data('event-id');
                    window.location.href = `/parent/parent_event_details_page/?event_id=${eventId}`;
                });
            },
            error: function (xhr) {
                alert('Error fetching event banners: ' + xhr.responseText);
            }
        });
    }

    // Load the event banners on page load
    loadEventBanners();
});
