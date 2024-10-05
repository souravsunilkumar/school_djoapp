$(document).ready(function () {
    function getCSRFToken() {
        const tokenElement = $('[name=csrfmiddlewaretoken]');
        return tokenElement.length ? tokenElement.val() : '';
    }
    
    $('#logout_button').on('click', function() {
        $.ajax({
            url: '/setup_auth/api/logout/',
            type: 'POST',
            success: function(response) {
                if (response.success) {
                    alert('Logged out successfully.');
                    window.location.href = '/'; // Redirect to the login page
                } else {
                    alert('Logout failed: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error during logout.');
                console.error(error);
            }
        });
    });
});
