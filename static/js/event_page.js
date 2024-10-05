$(document).ready(function () {
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;
    let currentIndex = 0;
    let debounceTimeout;

    // Function to fetch event banners
    function loadEventBanners() {
        $.ajax({
            url: '/events/event_page_data/',
            method: 'GET',
            success: function (response) {
                const banners = response.event_banners;
                const bannerSlider = $('#banner-slider');

                // Clear existing banners
                bannerSlider.empty();

                // Create a wrapper for the sliding effect
                const sliderWrapper = $('<div class="slider-wrapper"></div>');
                bannerSlider.append(sliderWrapper);

                // Create left and right arrows for navigation
                const leftArrow = $('<div class="arrow left-arrow">&#10094;</div>');
                const rightArrow = $('<div class="arrow right-arrow">&#10095;</div>');
                bannerSlider.append(leftArrow);
                bannerSlider.append(rightArrow);

                // Loop through banners and append to the slider wrapper
                banners.forEach((banner, index) => {
                    const bannerItem = $(`
                        <div class="banner-item" data-event-id="${banner.event_id}" data-index="${index}">
                            <img src="${banner.banner_image_url}" alt="${banner.banner_title}" />
                            <h3>${banner.banner_title}</h3>
                        </div>
                    `);
                    sliderWrapper.append(bannerItem);

                    // Add click event to each banner item
                    bannerItem.on('click', function () {
                        const eventId = $(this).data('event-id');
                        window.location.href = `/events/event_details/?id=${eventId}`;
                    });

                    // Drag events for manual sliding
                    bannerItem.on('mousedown touchstart', touchStart);
                    bannerItem.on('mousemove touchmove', touchMove);
                    bannerItem.on('mouseup touchend', touchEnd);
                    bannerItem.on('mouseleave', touchEnd);
                });

                // Add click event for navigation arrows
                leftArrow.on('click', function () {
                    slideTo(currentIndex - 1);
                });

                rightArrow.on('click', function () {
                    slideTo(currentIndex + 1);
                });

                // Function to handle manual sliding
                function slideTo(index) {
                    const totalBanners = banners.length;
                    currentIndex = (index + totalBanners) % totalBanners; // Wrap the index
                    currentTranslate = -(currentIndex * 100);
                    sliderWrapper.css('transform', `translateX(${currentTranslate}%)`);
                    prevTranslate = currentTranslate; // Update previous translate value
                }

                // Touch/Mouse event handlers
                function touchStart(event) {
                    isDragging = true;
                    startPos = getPositionX(event);
                    animationID = requestAnimationFrame(animation);
                }

                function touchMove(event) {
                    if (!isDragging) return;
                    const currentPosition = getPositionX(event);
                    currentTranslate = prevTranslate + currentPosition - startPos;
                }

                function touchEnd() {
                    isDragging = false;
                    cancelAnimationFrame(animationID);

                    const movedBy = currentTranslate - prevTranslate;

                    if (movedBy < -50 && currentIndex < banners.length - 1) {
                        slideTo(currentIndex + 1);
                    } else if (movedBy > 50 && currentIndex > 0) {
                        slideTo(currentIndex - 1);
                    } else {
                        slideTo(currentIndex); // Return to original position if not dragged enough
                    }

                    // Update previous translate value for future moves
                    prevTranslate = currentTranslate;

                    // Reset debounce timeout for automatic sliding after manual slide
                    clearTimeout(debounceTimeout);
                    debounceTimeout = setTimeout(startAutoSlide, 3000);
                }

                function getPositionX(event) {
                    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
                }

                function animation() {
                    sliderWrapper.css('transform', `translateX(${currentTranslate}px)`);
                    if (isDragging) requestAnimationFrame(animation);
                }

                // Automatic sliding every 3 seconds
                function startAutoSlide() {
                    clearInterval(autoSlideInterval); // Clear any existing interval
                    autoSlideInterval = setInterval(function () {
                        if (!isDragging) {
                            slideTo(currentIndex + 1);
                        }
                    }, 3000);
                }

                // Start automatic sliding
                let autoSlideInterval = setInterval(function () {
                    if (!isDragging) {
                        slideTo(currentIndex + 1);
                    }
                }, 3000);

                // Start auto-slide timeout after manual interaction
                debounceTimeout = setTimeout(startAutoSlide, 3000);
            }
        });
    }

    // Function to load all events into the table
    function loadAllEvents() {
        $.ajax({
            url: '/events/all_events/',
            method: 'GET',
            success: function (response) {
                const events = response.events;
                const eventTableBody = $('#event-table tbody');
                eventTableBody.empty(); // Clear existing rows

                // Append each event to the table
                events.forEach(event => {
                    const row = $(`
                    <tr data-event-id="${event.event_id}">
                        <td>${event.title}</td>
                        <td>${event.description}</td>
                        <td>${event.event_date}</td>
                        <td>
                            <button class="edit-button">Edit</button><br><br>

                            <button class="delete-button">Delete</button>
                        </td>
                    </tr>
                `);
                    eventTableBody.append(row);
                });

                // Add click event listeners for edit and delete buttons
                $('.edit-button').on('click', function () {
                    const eventId = $(this).closest('tr').data('event-id');
                    window.location.href = `/events/edit_event_page?id=${eventId}`;
                });

                $('.delete-button').on('click', function () {
                    const eventId = $(this).closest('tr').data('event-id');
                    if (confirm('Are you sure you want to delete this event?')) {
                        $.ajax({
                            url: `/events/delete_event/${eventId}/`,
                            method: 'DELETE',
                            success: function () {
                                alert('Event deleted successfully!');
                                loadAllEvents();
                            },
                            error: function () {
                                alert('Error deleting event. Please try again.');
                            }
                        });
                    }
                });
            },
            error: function () {
                alert('Error loading events. Please try again.');
            }
        });
    }

    // Call the functions to load banners and all events when the page is ready
    loadEventBanners();
    loadAllEvents();
});
