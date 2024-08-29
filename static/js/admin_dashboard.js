$(document).ready(function() {
    console.log('Admin Dashboard loaded successfully.');

    // Show Sub Admin Registration Form when the button is clicked
    $('#show-register-form').click(function() {
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

        $.ajax({
            url: 'http://127.0.0.1:8000/setup_auth/api/register_sub_admin/', // Ensure this matches the actual URL
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Response received:', response);
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
                console.error('Error:', error);
            }
        });
    });

    // Hide the Sub Admin Registration Form when the "Cancel" button is clicked
    $('#cancel-register').click(function() {
        $('#sub-admin-form').hide(); // Hide the registration form
    });
});
