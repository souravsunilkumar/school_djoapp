$(document).ready(function() {
    // Function to fetch event banners
    function loadEventBanners() {
        $.ajax({
            url: '/events/event_page_data/',
            method: 'GET',
            success: function(response) {
                const banners = response.event_banners;
                const bannerSlider = $('#banner-slider');

                // Clear existing banners
                bannerSlider.empty();

                // Create a wrapper for the sliding effect
                const sliderWrapper = $('<div class="slider-wrapper"></div>');
                bannerSlider.append(sliderWrapper);

                // Loop through banners and append to the slider wrapper
                banners.forEach(banner => {
                    const bannerItem = $(`
                        <div class="banner-item" data-event-id="${banner.event_id}">
                            <img src="${banner.banner_image_url}" alt="${banner.banner_title}" />
                            <h3>${banner.banner_title}</h3>
                        </div>
                    `);
                    sliderWrapper.append(bannerItem);

                    // Add click event to each banner item
                    bannerItem.on('click', function() {
                        const eventId = $(this).data('event-id');
                        window.location.href = `/events/event_details/?id=${eventId}`;
                    });
                });

                // Initialize automatic sliding
                let currentIndex = 0;
                const totalBanners = banners.length;

                // Clone the first banner and append it to the end of the slider
                const firstBannerClone = sliderWrapper.children().first().clone();
                sliderWrapper.append(firstBannerClone);

                // Function to slide the banners in one direction
                function slideBanners() {
                    currentIndex++;

                    // Apply the slide effect
                    const translateXValue = -(currentIndex * 100); // Calculate the translation value
                    sliderWrapper.css('transform', `translateX(${translateXValue}%)`);

                    // If we're at the last slide (which is the clone), reset to the first slide
                    if (currentIndex === totalBanners) {
                        setTimeout(function() {
                            sliderWrapper.css('transition', 'none'); // Disable the transition
                            currentIndex = 0; // Reset to the first banner
                            sliderWrapper.css('transform', `translateX(0%)`); // Reset position
                        }, 500); // Wait for the current transition to finish before resetting

                        setTimeout(function() {
                            sliderWrapper.css('transition', 'transform 0.5s ease-in-out'); // Re-enable the transition
                        }, 600); // Re-enable the transition after the reset
                    }
                }

                // Set an interval to automatically slide banners every 3 seconds
                setInterval(slideBanners, 3000);
            }
        });
    }

    // Call the function to load banners when the page is ready
    loadEventBanners();
});
