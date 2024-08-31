$(document).ready(function() {
    $('#login_form').on('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting traditionally

        var username = $('#username').val();
        var password = $('#password').val();

        var formData = {
            username: username,
            password: password
        };

        $.ajax({
            url: 'http://127.0.0.1:8000/setup_auth/api/login/', // API endpoint for login
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    window.location.href = response.redirect_url; // Redirect to the appropriate dashboard
                } else {
                    alert('Login failed: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error during login.');
                console.error(error);
            }
        });
    });
});
