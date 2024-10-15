$(document).ready(function() {
    
    // Clear the history state after successful login to prevent back navigation to the login page
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }

    // Handle the login form submission via AJAX
    $('#login_form').on('submit', function(event) {
        event.preventDefault(); // Prevent traditional form submission

        var username = $('#username').val();
        var password = $('#password').val();

        var formData = {
            username: username,
            password: password
        };

        $.ajax({
            url: '/setup_auth/api/login/', // API endpoint for login
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

    // Prevent back navigation after logout
    window.addEventListener('popstate', function (event) {
        // Check if the user is logged out
        $.ajax({
            url: '/setup_auth/api/is_logged_in/',  // Create an API endpoint that checks if the user is authenticated
            type: 'GET',
            success: function (response) {
                if (!response.is_authenticated) {
                    window.location.href = "/";  // Redirect to the login page
                }
            },
            error: function (error) {
                console.error('Error checking user authentication status:', error);
            }
        });
    });
});
