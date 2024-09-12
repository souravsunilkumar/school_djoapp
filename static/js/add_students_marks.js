$(document).ready(function () {
    var examModal = $('#examModal');
    var subjectModal = $('#subjectModal');
    var openExamModalBtn = $('#openExamModalBtn');
    var openSubjectModalBtn = $('#openSubjectModalBtn');
    var closeBtn = $('.close');

    // Open the exam modal
    openExamModalBtn.on('click', function () {
        examModal.fadeIn();  // Use fadeIn for a smooth transition
        loadAcademicYears(); // Load academic years when opening the modal
    });

    // Open the subject modal
    openSubjectModalBtn.on('click', function () {
        subjectModal.fadeIn();  // Use fadeIn for a smooth transition
        loadAcademicYearsForSubject(); // Load academic years when opening the modal
        loadClassesAndDivisions(); // Load classes and divisions for the subject modal
    });

    // Close the modals
    closeBtn.on('click', function () {
        var modalId = $(this).data('modal');
        $('#' + modalId).fadeOut();  // Use fadeOut for a smooth transition
    });

    // Close the modal when clicking outside of it
    $(window).on('click', function (event) {
        if ($(event.target).is(examModal)) {
            examModal.fadeOut();  // Use fadeOut for a smooth transition
        } else if ($(event.target).is(subjectModal)) {
            subjectModal.fadeOut();  // Use fadeOut for a smooth transition
        }
    });

    // Load academic years for the exam modal
    function loadAcademicYears() {
        $.ajax({
            url: '/management/get_academic_years/', // Endpoint to get academic years
            type: 'GET',
            success: function (response) {
                var academicYearSelect = $('#academicYearSelect');
                academicYearSelect.empty(); // Clear existing options
                academicYearSelect.append('<option value="" disabled selected>Select Academic Year</option>'); // Default option

                if (Array.isArray(response.academic_years) && response.academic_years.length > 0) {
                    $.each(response.academic_years, function (index, year) {
                        academicYearSelect.append('<option value="' + year + '">' + year + '</option>');
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error("Error fetching academic years:", error);
            }
        });
    }
    // Handle form submission to add exam
    $('#addExamForm').on('submit', function (e) {
        e.preventDefault();  // Prevent default form submission behavior

        var examName = $('#examName').val();
        var newAcademicYear = $('#newAcademicYear').val();
        var selectedAcademicYear = $('#academicYearSelect').val();
        var academicYear = newAcademicYear || selectedAcademicYear; // Use new year if provided
        var csrfToken = $('#csrfToken').val(); // Retrieve CSRF token from hidden field

        // Ensure either a new year is provided or an existing year is selected
        if (!examName || !academicYear) {
            alert('Please provide both exam name and academic year.');
            return; // Stop submission if any field is missing
        }

        $.ajax({
            url: '/management/add_exam/',
            type: 'POST',
            headers: {
                'X-CSRFToken': csrfToken // Ensure CSRF token is sent in the headers
            },
            data: {
                'exam_name': examName,
                'academic_year': academicYear
            },
            success: function (response) {
                if (response.success) {
                    alert('Exam "' + examName + '" added successfully!');
                    modal.fadeOut();  // Hide modal on success
                    $('#addExamForm')[0].reset();  // Reset the form fields
                    loadAcademicYears(); // Reload academic years in case a new one was added
                } else {
                    alert('Error adding exam: ' + (response.error || 'Unknown error.'));
                }
            },
            error: function (xhr, status, error) {
                alert('An error occurred while adding the exam: ' + error);
            }
        });
    });

    // Load academic years for the subject modal
    function loadAcademicYearsForSubject() {
        $.ajax({
            url: '/management/get_academic_years/', // Endpoint to get academic years
            type: 'GET',
            success: function (response) {
                var academicYearSelectSubject = $('#academicYearSelectSubject');
                academicYearSelectSubject.empty(); // Clear existing options
                academicYearSelectSubject.append('<option value="" disabled selected>Select Academic Year</option>'); // Default option

                if (Array.isArray(response.academic_years) && response.academic_years.length > 0) {
                    $.each(response.academic_years, function (index, year) {
                        academicYearSelectSubject.append('<option value="' + year + '">' + year + '</option>');
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error("Error fetching academic years:", error);
            }
        });
    }

    // Load exams based on selected academic year
    function loadExams(academicYear) {
        $.ajax({
            url: '/management/get_exams/?academic_year=' + academicYear,
            type: 'GET',
            success: function (response) {
                var examSelect = $('#examSelect');
                examSelect.empty(); // Clear existing options
                examSelect.append('<option value="" disabled selected>Select Exam</option>'); // Default option

                if (Array.isArray(response.exams) && response.exams.length > 0) {
                    $.each(response.exams, function (index, exam) {
                        examSelect.append('<option value="' + exam.exam_id + '">' + exam.exam_name + '</option>');
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error("Error fetching exams:", error);
            }
        });
    }

    // Load classes and divisions based on selected academic year and exam
    function loadClassesAndDivisions() {
        $.ajax({
            type: 'GET',
            url: '/management/get_classes_and_divisions/',
            success: function (response) {
                var classDropdown = $('#classSelect');
                var divisionDropdown = $('#divisionSelect');
                
                classDropdown.empty().append('<option value="">Select Class</option>');
                divisionDropdown.empty().append('<option value="">Select Division</option>');

                if (Array.isArray(response.classes) && response.classes.length > 0) {
                    $.each(response.classes, function (index, cls) {
                        classDropdown.append('<option value="' + cls.class_assigned + '">' + cls.class_assigned + '</option>');
                    });
                }

                // Load divisions when a class is selected
                classDropdown.on('change', function () {
                    var selectedClass = $(this).val();
                    if (selectedClass) {
                        loadDivisions(selectedClass);
                    } else {
                        divisionDropdown.empty().append('<option value="">Select Division</option>');
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error('Error fetching classes.', error);
            }
        });
    }

    // Fetch divisions based on selected class
    function loadDivisions(classAssigned) {
        $.ajax({
            type: 'GET',
            url: '/management/get_classes_and_divisions/',
            data: { class_id: classAssigned },
            success: function (response) {
                var divisionDropdown = $('#divisionSelect');
                divisionDropdown.empty().append('<option value="">Select Division</option>');

                if (Array.isArray(response.divisions) && response.divisions.length > 0) {
                    $.each(response.divisions, function (index, div) {
                        divisionDropdown.append('<option value="' + div.division_assigned + '">' + div.division_assigned + '</option>');
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching divisions.', error);
            }
        });
    }

    // Load exams when an academic year is selected
    $('#academicYearSelectSubject').on('change', function () {
        var selectedAcademicYear = $(this).val();
        loadExams(selectedAcademicYear); // Load exams based on the selected academic year
    });

    // Handle form submission to add subject
    $('#addSubjectForm').on('submit', function (e) {
        e.preventDefault();  // Prevent default form submission behavior

        var subjectName = $('#subjectName').val();
        var academicYear = $('#academicYearSelectSubject').val();
        var examId = $('#examSelect').val();
        var classAssigned = $('#classSelect').val();
        var divisionAssigned = $('#divisionSelect').val();
        var csrfToken = $('#csrfTokenSubject').val(); // Retrieve CSRF token from hidden field

        // Ensure all required fields are filled
        if (!subjectName || !academicYear || !examId || !classAssigned || !divisionAssigned) {
            alert('Please provide all required fields.');
            return; // Stop submission if any field is missing
        }

        $.ajax({
            url: '/management/add_subject/', // Endpoint to add subject
            type: 'POST',
            headers: {
                'X-CSRFToken': csrfToken // Ensure CSRF token is sent in the headers
            },
            data: {
                'subject_name': subjectName,
                'academic_year': academicYear,
                'exam': examId,
                'class_assigned': classAssigned, // Change to match the field name in view
                'division_assigned': divisionAssigned
            },
            success: function (response) {
                if (response.success) {
                    alert('Subject "' + subjectName + '" added successfully!');
                    subjectModal.fadeOut();  // Hide modal on success
                    $('#addSubjectForm')[0].reset();  // Reset the form fields
                } else {
                    alert('Error adding subject: ' + (response.error || 'Unknown error.'));
                }
            },
            error: function (xhr, status, error) {
                alert('An error occurred while adding the subject: ' + error);
            }
        });
    });
});
