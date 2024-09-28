$(document).ready(function() {
    console.log('Document ready'); // Debugging statement

    $('#register_school').click(function() {
        console.log('Register School button clicked'); // Debugging statement
        $(this).addClass('active'); // Add active class
        setTimeout(() => $(this).removeClass('active'), 300); // Remove active class after 300ms
        window.location.href = '/setup_auth/register/';
    });

    $('#login').click(function() {
        console.log('Login button clicked'); // Debugging statement
        $(this).addClass('active'); // Add active class
        setTimeout(() => $(this).removeClass('active'), 300); // Remove active class after 300ms
        window.location.href = '/setup_auth/login/';
    });

    $('#register_parent').click(function() {
        console.log('Register Parent button clicked'); // Debugging statement
        $(this).addClass('active'); // Add active class
        setTimeout(() => $(this).removeClass('active'), 300); // Remove active class after 300ms
        window.location.href = '/setup_auth/parent_register/';
    });
});