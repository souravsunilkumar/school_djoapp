$(document).ready(function() {

    $('h1').text('jQuery is working!');

    // Initially hide the content
    $('#hidden-content').hide();
    $('#hidden-school_admin').hide();
    $('#hidden-office').hide();


    $('#school_admin').click(function(){
        $('#hidden-school_admin').show();
        $('#hidden-office').hide();
        $('#hidden-content').hide();
    });
    $('#school_employee').click(function(){
        $('#hidden-office').show();
        $('#hidden-content').hide();
        $('#hidden-school_admin').hide();
    });
    // Show the hidden content when the button is clicked
    $('#show-btn').click(function() {
        $('#hidden-content').show(); // or use fadeIn() for a fade-in effect
    });

    $('#school_employee_form').on('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting via the browser

        var csrftoken = $('[name=csrfmiddlewaretoken]').val();
        // Collect form data
        var school_employee_data = {
            username: $('#name').val(),
            password: $('#email').val(),
        };
        
             // Send data to the backend as JSON
             $.ajax({
                url: '/submit', // The backend endpoint
                type: 'POST',
                contentType: 'application/json',
                headers: {
                    'X-CSRFToken': csrftoken // Set the CSRF token in the request header
                },
                data: JSON.stringify(formData),
                success: function(response) {
                    alert('Form submitted successfully!');
                    console.log(response);
                },
                error: function(error) {
                    alert('There was an error submitting the form.');
                    console.error(error);
                }
            });
        });

});
