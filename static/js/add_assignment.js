$(document).ready(function () {
    // Load classes, divisions, and academic years
    loadClassesAndDivisions();
    loadAcademicYears();

// Disable/Enable fields based on user input
$('#academicYearSelect').on('change', function () {
    if ($(this).val()) {
        $('#newAcademicYear').val('').prop('disabled', true);
    } else {
        $('#newAcademicYear').prop('disabled', false);
    }
});

$('#newAcademicYear').on('input', function () {
    if ($(this).val()) {
        $('#academicYearSelect').val('').prop('disabled', true);
    } else {
        $('#academicYearSelect').prop('disabled', false);
    }
});

// Submit the assignment form
$('#addAssignmentForm').on('submit', function (e) {
    e.preventDefault();

    const subject = $('#subject').val();
    const classAssigned = $('#classSelect').val();
    const divisionAssigned = $('#divisionSelect').val();
    const title = $('#title').val();
    const description = $('#description').val();
    const dueDate = $('#due_date').val();
    let academicYear = $('#academicYearSelect').val();
    const newAcademicYear = $('#newAcademicYear').val();

    // Validate the academic year format
    const yearFormat = /^\d{4}-\d{4}$/; // Matches YYYY-YYYY
    if (newAcademicYear && !yearFormat.test(newAcademicYear)) {
        alert('Please enter a valid academic year in the format YYYY-YYYY.');
        return;
    }

    // If a new academic year is provided, use that instead of the selected one
    if (newAcademicYear) {
        academicYear = newAcademicYear;
    }

    const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();

    $.ajax({
        type: 'POST',
        url: '/management/add_assignment/',
        data: {
            subject: subject,
            class_assigned: classAssigned,
            division_assigned: divisionAssigned,
            title: title,
            description: description,
            due_date: dueDate,
            academic_year: academicYear,
            csrfmiddlewaretoken: csrfToken
        },
        success: function (response) {
            console.log('Assignment added successfully:', response);
            alert('Assignment added successfully');
            $('#addAssignmentForm')[0].reset();
            $('#academicYearSelect').prop('disabled', false);
            $('#newAcademicYear').prop('disabled', false);
        },
        error: function (xhr, status, error) {
            console.error('Error adding assignment:', error);
        }
    });
});
});

// Load classes and divisions using AJAX
function loadClassesAndDivisions() {
    console.log('Loading classes and divisions...');
    $.ajax({
        type: 'GET',
        url: '/management/get_classes_and_divisions/',
        success: function (response) {
            console.log('Received response:', response);
            var classDropdown = $('#classSelect');
            var divisionDropdown = $('#divisionSelect');

            classDropdown.empty().append('<option value="">Select Class</option>');
            divisionDropdown.empty().append('<option value="">Select Division</option>');

            if (Array.isArray(response.classes) && response.classes.length > 0) {
                console.log('Populating classes dropdown...');
                $.each(response.classes, function (index, cls) {
                    console.log('Adding class:', cls.class_assigned);
                    classDropdown.append('<option value="' + cls.class_assigned + '">' + cls.class_assigned + '</option>');
                });
            } else {
                console.log('No classes found in response.');
            }

            // Load divisions when a class is selected
            classDropdown.on('change', function () {
                var selectedClass = $(this).val();
                console.log('Selected class:', selectedClass);
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

// Load divisions based on selected class
function loadDivisions(classAssigned) {
    console.log('Loading divisions for class:', classAssigned);
    $.ajax({
        type: 'GET',
        url: '/management/get_classes_and_divisions/',
        data: { class_id: classAssigned },
        success: function (response) {
            console.log('Received divisions:', response);
            var divisionDropdown = $('#divisionSelect');
            divisionDropdown.empty().append('<option value="">Select Division</option>');

            if (Array.isArray(response.divisions) && response.divisions.length > 0) {
                console.log('Populating divisions dropdown...');
                $.each(response.divisions, function (index, div) {
                    console.log('Adding division:', div.division_assigned);
                    divisionDropdown.append('<option value="' + div.division_assigned + '">' + div.division_assigned + '</option>');
                });
            } else {
                console.log('No divisions found for the selected class.');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error fetching divisions.', error);
        }
    });
}

// Load academic years using AJAX
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
