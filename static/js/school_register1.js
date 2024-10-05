$(document).ready(function() {
    $('#school-register-form').on('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        var password = $('#password').val();
        var confirmPassword = $('#confirm_password').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        var formData = {
            school_name: $('#school_name').val(),
            school_address: $('#school_address').val(),
            contact_number: $('#contact_number').val(),
            contact_email: $('#contact_email').val(),
            school_admin_username: $('#school_admin_username').val(),
            school_admin_first_name: $('#school_admin_first_name').val(),
            school_admin_last_name: $('#school_admin_last_name').val(),
            password: password // Send password to server
        };

        $.ajax({
            url: '/setup_auth/api/register/', // Ensure this matches the actual URL
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    alert(response.message);
                    window.location.href = '/';
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error submitting the form.');
                console.error(error); // Log the error to the console for debugging
            }
        });
    });
});
