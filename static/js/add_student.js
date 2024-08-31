$(document).ready(function() {
    function fetchWardens() {
        $.ajax({
            url: '/management/api/get_wardens/', // Ensure this endpoint is correct
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    var wardensList = response.wardens;
                    var wardenDropdown = $('#warden');

                    wardenDropdown.empty();

                    
                    wardensList.forEach(function(warden) {
                        wardenDropdown.append('<option value="' + warden.id + '">' + warden.name + '</option>');
                    });

                    
                    wardenDropdown.append('<option value="not_a_hostler">Not a hostler</option>');
                } else {
                    $('#warden').html('<option value="">No wardens found.</option>');
                }
            },
            error: function(error) {
                console.error('Error loading wardens:', error);
                $('#warden').html('<option value="">Error loading wardens.</option>');
            }
        });
    }

    function fetchTeacherDetails() {
        $.ajax({
            url: '/setup_auth/api/teacher/dashboard/', // Ensure this endpoint is correct
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    $('#class_assigned').val(response.data.class_assigned);
                    $('#division_assigned').val(response.data.division_assigned);
                } else {
                    alert('Failed to load teacher details.');
                }
            },
            error: function(error) {
                console.error('Error loading teacher details:', error);
                alert('There was an error loading teacher details.');
            }
        });
    }

    $('#add-student-form').on('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        var studentData = {
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            gender: $('#gender').val(),
            admission_number: $('#admission_number').val(),
            roll_number: $('#roll_number').val(),
            parents_number: $('#parents_number').val(),
            parents_email: $('#parents_email').val(),
            warden: $('#warden').val()
        };

        $.ajax({
            url: '/management/api/add_student/', // Correct API endpoint
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(studentData),
            success: function(response) {
                if (response.success) {
                    alert('Student added successfully.');
                } else {
                    alert('Failed to add student: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error adding the student.');
                console.error(error);
            }
        });
    });

    fetchTeacherDetails(); // Fetch teacher details on page load
    fetchWardens(); // Fetch wardens on page load
});
