
$(document).ready(function() {
    console.log('Document ready'); // Debugging statement

    $('#register_school').click(function(){
        console.log('Register School button clicked'); // Debugging statement
        window.location.href = 'http://127.0.0.1:8000/setup_auth/register/';
    });

    $('#login').click(function(){
        console.log('Login button clicked'); // Debugging statement
        window.location.href = 'http://127.0.0.1:8000/setup_auth/login/';
    });
});
