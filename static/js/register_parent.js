$(document).ready(function() {
    // Initialize Select2 on the student select field
    $('#student').select2({
        placeholder: 'Select a student',
        allowClear: true,
        
    });

    // Fetch the CSRF token from the meta tag or hidden input
    var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();

    // Fetch students of the logged-in class teacher
    function fetchStudents() {
        $.ajax({
            url: '/management/get_class_teacher_students/', // API endpoint to get students
            method: 'GET',
            beforeSend: function() {
                // Show loading indicator here (if you want)
                $('#student').prop('disabled', true); // Disable the select during loading
            },
            success: function(data) {
                let studentSelect = $('#student');
                studentSelect.empty(); // Clear existing options

                if (data.students.length === 0) {
                    studentSelect.append(new Option("No students available", "", false, true));
                } else {
                    data.students.forEach(function(student) {
                        studentSelect.append(new Option(student.name, student.id));
                    });
                }

                studentSelect.prop('disabled', false); // Enable select again
                studentSelect.select2(); // Refresh Select2 to reflect changes
            },
            error: function() {
                alert('Failed to load students.');
                $('#student').prop('disabled', false); // Enable select again
            }
        });
    }

    fetchStudents(); // Call the function to fetch students on page load

    // Handle form submission
    $('#registerParentForm').on('submit', function(e) {
        e.preventDefault();

        let formData = {
            first_name: $('#first_name').val(),
            second_name: $('#second_name').val(),
            contact_number: $('#contact_number').val(),
            email: $('#email').val(),
            username: $('#username').val(),
            password: $('#password').val(),
            confirm_password: $('#confirm_password').val(),
            student: $('#student').val(),
        };

        // Validate email format
        const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
        if (!emailPattern.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Ensure passwords match
        if (formData.password !== formData.confirm_password) {
            alert('Passwords do not match.');
            return;
        }

        $.ajax({
            url: '/management/register_parent/', // API endpoint to register parent
            method: 'POST',
            data: formData,
            headers: {
                'X-CSRFToken': csrfToken // Add CSRF token to headers
            },
            beforeSend: function() {
                // Show loading indicator here
            },
            success: function(response) {
                alert('Parent registered successfully.');
                window.location.href = '/management/teacher_dashboard/'; // Redirect upon success
            },
            error: function(xhr) {
                if (xhr.status === 400) {
                    alert('Failed to register parent: ' + xhr.responseJSON.error);
                } else {
                    alert('Failed to register parent. Please try again.');
                }
            },
            complete: function() {
                // Hide loading indicator here
            }
        });
    });

});
