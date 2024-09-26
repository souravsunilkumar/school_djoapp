$(document).ready(function () {
    // Function to get the CSRF token
    function getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }

    // Step 1: Fetch schools and populate the school dropdown
    $.ajax({
        url: '/parent/get_schools/',
        method: 'GET',
        success: function (response) {
            let schools = response.schools;
            schools.forEach(school => {
                $('#school-select').append(`<option value="${school.school_id}">${school.school_name}</option>`);
            });
        }
    });

    // Step 2: When a school is selected, enable and populate class and division dropdown
    $('#school-select').on('change', function () {
        let schoolId = $(this).val();
        if (schoolId) {
            $('#school-select').addClass('selected');
            $('#class-division-select').prop('disabled', false);
            $('#class-division-select').empty().append('<option value="">Select Class and Division</option>');
            $.ajax({
                url: `/parent/get_classes_and_divisions/${schoolId}/`,
                method: 'GET',
                success: function (response) {
                    let classDivisions = response.classes;
                    classDivisions.forEach(cd => {
                        $('#class-division-select').append(`<option value="${cd}">${cd}</option>`);
                    });
                }
            });
        } else {
            $('#class-division-select').prop('disabled', true);
            $('#student-select').prop('disabled', true);
            $('#link-student-btn').prop('disabled', true);
        }
    });

    // Step 3: When class and division are selected, enable and populate student dropdown
    $('#class-division-select').on('change', function () {
        let classDivision = $(this).val();
        let schoolId = $('#school-select').val();
        if (classDivision && schoolId) {
            $('#class-division-select').addClass('selected');
            $('#student-select').prop('disabled', false);
            $('#student-select').empty().append('<option value="">Select Student</option>');
            $.ajax({
                url: `/parent/get_students/${schoolId}/${classDivision}/`,
                method: 'GET',
                success: function (response) {
                    let students = response.students;
                    students.forEach(student => {
                        $('#student-select').append(`<option value="${student.id}">${student.first_name} ${student.last_name}</option>`);
                    });
                }
            });
        } else {
            $('#student-select').prop('disabled', true);
            $('#link-student-btn').prop('disabled', true);
        }
    });

    // Enable the Link Student button once a student is selected
    $('#student-select').on('change', function () {
        $('#student-select').addClass('selected');
        $('#link-student-btn').prop('disabled', !$(this).val());
    });

    // Link the selected student to the parent
    $('#link-student-btn').on('click', function () {
        let studentId = $('#student-select').val();
        let parentId = $('#parent-id').val();  // Use hidden input field to store parent ID
        $.ajax({
            url: '/parent/link_student/',
            method: 'POST',
            data: {
                student_id: studentId,
                parent_id: parentId,
                csrfmiddlewaretoken: getCSRFToken()  // Using the dynamically fetched CSRF token
            },
            success: function (response) {
                alert('Student successfully linked to parent!');
            },
            error: function (xhr) {
                alert('Error linking student: ' + xhr.responseText);
            }
        });
    });
});
