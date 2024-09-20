$(document).ready(function () {
    // Load classes and divisions
    loadClassesAndDivisions();

    // Submit the assignment form
    $('#addAssignmentForm').on('submit', function (e) {
        e.preventDefault();

        const subject = $('#subject').val();
        const classAssigned = $('#classSelect').val();
        const divisionAssigned = $('#divisionSelect').val();
        const title = $('#title').val();
        const description = $('#description').val();
        const dueDate = $('#due_date').val();

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
                csrfmiddlewaretoken: csrfToken
            },
            success: function (response) {
                console.log('Assignment added successfully:', response);
                alert('Assignment added successfully');
                // Optionally redirect or reset the form
                $('#addAssignmentForm')[0].reset();
            },
            error: function (xhr, status, error) {
                console.error('Error adding assignment.', error);
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
            console.log('Received response:', response); // Debug response data
            var classDropdown = $('#classSelect');
            var divisionDropdown = $('#divisionSelect');

            classDropdown.empty().append('<option value="">Select Class</option>');
            divisionDropdown.empty().append('<option value="">Select Division</option>');

            if (Array.isArray(response.classes) && response.classes.length > 0) {
                console.log('Populating classes dropdown...');
                $.each(response.classes, function (index, cls) {
                    console.log('Adding class:', cls.class_assigned); // Log each class added
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
            console.log('Received divisions:', response); // Debug division data
            var divisionDropdown = $('#divisionSelect');
            divisionDropdown.empty().append('<option value="">Select Division</option>');

            if (Array.isArray(response.divisions) && response.divisions.length > 0) {
                console.log('Populating divisions dropdown...');
                $.each(response.divisions, function (index, div) {
                    console.log('Adding division:', div.division_assigned); // Log each division added
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
