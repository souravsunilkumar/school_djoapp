$(document).ready(function () {
    function loadAcademicYears() {
        console.log('Loading academic years...');
        $.ajax({
            type: 'GET',
            url: '/management/get_assignment_academic_years/',
            success: function (response) {
                console.log('Received academic years:', response);
                var academicYearDropdown = $('#academicYearSelect');
                academicYearDropdown.empty().append('<option value="">Select Academic Year</option>');

                if (Array.isArray(response.academic_years) && response.academic_years.length > 0) {
                    console.log('Populating academic years dropdown...');
                    $.each(response.academic_years, function (index, year) {
                        console.log('Adding academic year:', year);
                        academicYearDropdown.append('<option value="' + year + '">' + year + '</option>');
                    });
                } else {
                    console.log('No academic years found.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching academic years.', error);
            }
        });
    }

    function loadAssignments(academicYear) {
        $.ajax({
            url: `/management/get_teacher_assignments/?academic_year=${academicYear}`,
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
                    assignmentsSlider.append('<p>No assignments available for this academic year.</p>');
                }
            },
            error: function (error) {
                console.error('Error fetching assignments:', error);
            }
        });
    }

    $('#academicYearSelect').change(function () {
        const selectedYear = $(this).val();
        if (selectedYear) {
            loadAssignments(selectedYear);
        }
    });

    // Load academic years on page load
    loadAcademicYears();

    // Slider functionality (same as before)
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

    $('.slider-next').click(function () {
        slider.animate({ scrollLeft: '+=410' }, 410);
    });

    $('.slider-prev').click(function () {
        slider.animate({ scrollLeft: '-=410' }, 410);
    });
});
