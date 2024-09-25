$(document).ready(function() {
    console.log('Admin Dashboard loaded successfully.');

    // Fetch Admin Details and update the dashboard
    $.ajax({
        url: '/setup_auth/api/admin_dashboard/',  // Ensure this URL points to the correct view
        type: 'GET',
        success: function(response) {
            console.log('Admin details fetched:', response);
            $('#admin-name').text(response.data.admin_name);
            $('#admin-name-dash').text(response.data.admin_name);
            $('#school-name').text(response.data.school_name);
        },
        error: function(error) {
            console.error('Error fetching admin details:', error);
        }
    });

    // Show Sub Admin Registration Form when the button is clicked
    $('#show-register-form').click(function() {
        console.log('Sub Admin register button clicked.');
        $('#sub-admin-form').toggle(); // Toggle visibility of the form
    });

    // Handle Sub Admin Registration Form submission via AJAX
    $('#sub-admin-register-form').on('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        var password = $('#password').val();
        var confirmPassword = $('#confirm_password').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        var formData = {
            sub_admin_username: $('#sub_admin_username').val(),
            sub_admin_first_name: $('#sub_admin_first_name').val(),
            sub_admin_last_name: $('#sub_admin_last_name').val(),
            password: password
        };

        console.log('Sub Admin registration form data:', formData);

        $.ajax({
            url: '/setup_auth/api/register_sub_admin/', // Ensure this matches the actual URL
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Sub Admin registration response received:', response);
                if (response.success) {
                    alert('Sub Admin registered successfully!');
                    $('#sub-admin-form').hide(); // Hide the form after successful registration
                    $('#sub-admin-register-form')[0].reset(); // Clear form fields
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error submitting the form.');
                console.error('Sub Admin registration error:', error);
            }
        });
    });

    // Hide the Sub Admin Registration Form when the "Cancel" button is clicked
    $('#cancel-register').click(function() {
        $('#sub-admin-form').hide(); // Hide the registration form
    });

    // Show Employee Registration Form when the button is clicked
    $('#show-employee-register-form').click(function() {
        console.log('Employee register button clicked.');
        $('#employee-register-form').toggle(); // Toggle visibility of the form
    });

    // Handle Employee Registration Form submission via AJAX
    $('#employee-registration-form').on('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        var password = $('#emp_password').val();
        var confirmPassword = $('#emp_confirm_password').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        var formData = {
            emp_username: $('#emp_username').val(),
            emp_first_name: $('#emp_first_name').val(),
            emp_last_name: $('#emp_last_name').val(),
            emp_contact: $('#emp_contact').val(),
            emp_designation: $('#emp_designation').val(),
            password: password
        };

        console.log('Employee registration form data:', formData);

        $.ajax({
            url: '/setup_auth/api/register_employee/', // Ensure this matches the actual URL
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Employee registration response received:', response);
                if (response.success) {
                    alert('Employee registered successfully!');
                    $('#employee-register-form').hide(); // Hide the form after successful registration
                    $('#employee-registration-form')[0].reset(); // Clear form fields
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error submitting the form.');
                console.error('Employee registration error:', error);
            }
        });
    });

    // Hide the Employee Registration Form when the "Cancel" button is clicked
    $('#cancel-employee-register').click(function() {
        $('#employee-register-form').hide(); // Hide the registration form
    });
});
