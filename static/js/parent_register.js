$(document).ready(function () {
    // Utility function to get CSRF token
    function getCSRFToken() {
        const tokenElement = $('[name=csrfmiddlewaretoken]');
        if (tokenElement.length) {
            return tokenElement.val();
        } else {
            console.error("CSRF token not found in HTML.");
            return ''; // Handle the missing CSRF token case appropriately
        }
    }

    // Step navigation functions
    $('#next_to_step2').click(function () {
        $('#step1').hide();
        $('#step2').show();
        fetchSchools();
    });

    $('#next_to_step3').click(function () {
        $('#step2').hide();
        $('#step3').show();
        fetchClassesAndDivisions();
    });

    $('#next_to_step4').click(function () {
        $('#step3').hide();
        $('#step4').show();
        fetchStudents();
    });

    $('#submit_registration').click(function () {
        submitRegistration();
    });

    // Fetch Schools
    function fetchSchools() {
        $.ajax({
            url: '/setup_auth/get_schools/',
            method: 'GET',
            success: function (data) {
                $('#school').empty();
                $.each(data.schools, function (index, school) {
                    $('#school').append(`<option value="${school.school_id}">${school.school_name}</option>`);
                });
            },
            error: function (error) {
                console.error('Error fetching schools:', error);
            }
        });
    }

    // Fetch Classes and Divisions
    function fetchClassesAndDivisions() {
        const schoolId = $('#school').val();
        $.ajax({
            url: `/setup_auth/get_classes_and_divisions/${encodeURIComponent(schoolId)}/`,
            method: 'GET',
            success: function (data) {
                $('#class_division').empty();
                $.each(data.classes, function (index, classDivision) {
                    $('#class_division').append(`<option value="${classDivision}">${classDivision}</option>`);
                });
            },
            error: function (error) {
                console.error('Error fetching classes and divisions:', error);
            }
        });
    }

    // Fetch Students
    function fetchStudents() {
        const schoolId = $('#school').val();
        const classDivision = $('#class_division').val();
        $.ajax({
            url: `/setup_auth/get_students/${encodeURIComponent(schoolId)}/${encodeURIComponent(classDivision)}/`,
            method: 'GET',
            success: function (data) {
                $('#students').empty();
                $.each(data.students, function (index, student) {
                    $('#students').append(`<option value="${student.id}">${student.first_name} ${student.last_name}</option>`);
                });
            },
            error: function (error) {
                console.error('Error fetching students:', error);
            }
        });
    }
    

    // Submit Registration
    function submitRegistration() {
        const username = $('#username').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirm_password').val();
        const firstName = $('#first_name').val();
        const secondName = $('#second_name').val();
        const email = $('#email').val();
        const contactNumber = $('#contact_number').val();
        const schoolId = $('#school').val();
        const classDivision = $('#class_division').val();
        const selectedStudents = $('#students').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const csrftoken = getCSRFToken();

        $.ajax({
            url: '/setup_auth/register_parent/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                first_name: firstName,
                second_name: secondName,
                email: email,
                contact_number: contactNumber,
                username: username,
                password: password,
                confirm_password: confirmPassword,
                school_id: schoolId,
                class_division: classDivision,
                students: selectedStudents
            },
            success: function(data) {
                alert('Parent registered successfully!');
                window.location.href = '/setup_auth/login/';
            },
            error: function(error) {
                console.error('Error registering parent:', error);
                alert('Error registering parent.');
            }
        });
    }
});
