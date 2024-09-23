$(document).ready(function () {
    function loadAssignments() {
        $.ajax({
            url: '/management/get_teacher_assignments/',  // URL to fetch assignments
            method: 'GET',
            success: function (data) {
                const assignmentsSlider = $('#assignments_slider');
                assignmentsSlider.empty();

                if (data.assignments && data.assignments.length > 0) {
                    data.assignments.forEach(function (assignment) {
                        const assignmentHtml = `
                            <div class="assignment-card">
                                <a href="/management/add_assignment_mark/${assignment.assignment_id}/">
                                    <h3>${assignment.title}</h3>
                                    <p><strong>Subject:</strong> ${assignment.subject}</p>
                                    <p><strong>Class:</strong> ${assignment.class_assigned} - ${assignment.division_assigned}</p>
                                    <p><strong>Due Date:</strong> ${assignment.due_date}</p>
                                    <p>${assignment.description}</p>
                                </a>
                            </div>
                        `;
                        assignmentsSlider.append(assignmentHtml);
                    });
                } else {
                    assignmentsSlider.append('<p>No assignments available.</p>');
                }
            },
            error: function (error) {
                console.error('Error fetching assignments:', error);
            }
        });
    }

    // Slider functionality
    let isDown = false;
    let startX;
    let scrollLeft;

    const slider = $('.slider');
    slider.on('mousedown', function (e) {
        isDown = true;
        slider.addClass('active');
        startX = e.pageX - slider.offset().left;
        scrollLeft = slider.scrollLeft();
    });

    slider.on('mouseleave', function () {
        isDown = false;
        slider.removeClass('active');
    });

    slider.on('mouseup', function () {
        isDown = false;
        slider.removeClass('active');
    });

    slider.on('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offset().left;
        const walk = (x - startX) * 3; // Scroll-fast multiplier
        slider.scrollLeft(scrollLeft - walk);
    });

    // Slider button controls
    $('.slider-next').click(function () {
        slider.animate({ scrollLeft: '+=300' }, 300);
    });

    $('.slider-prev').click(function () {
        slider.animate({ scrollLeft: '-=300' }, 300);
    });

    // Load assignments on page load
    loadAssignments();
});
