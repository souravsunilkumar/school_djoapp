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

});
