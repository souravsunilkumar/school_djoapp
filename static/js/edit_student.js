$(document).ready(function() {
    var studentId = $('#student_id').val();

    function fetchWardens() {
        $.ajax({
            url: '/management/api/get_wardens/',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    var wardensList = response.wardens;
                    var wardenDropdown = $('#warden');

                    wardenDropdown.empty();

                    wardensList.forEach(function(warden) {
                        wardenDropdown.append('<option value="' + warden.id + '">' + warden.name + '</option>');
                    });

                    wardenDropdown.append('<option value="not_a_hostler">Not a hostler</option>');

                    // After populating wardens, fetch the student details to set the selected warden
                    fetchStudentDetails();
                } else {
                    $('#warden').html('<option value="">No wardens found.</option>');
                }
            },
            error: function(error) {
                console.error('Error loading wardens:', error);
                $('#warden').html('<option value="">Error loading wardens.</option>');
            }
        });
    }

    function fetchStudentDetails() {
        $.ajax({
            url: '/management/api/get_student/' + studentId + '/',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    var student = response.data;
                    $('#first_name').val(student.first_name);
                    $('#last_name').val(student.last_name);
                    $('#gender').val(student.gender);
                    $('#admission_number').val(student.admission_number);
                    $('#roll_number').val(student.roll_number);
                    $('#parents_number').val(student.parents_number);
                    $('#parents_email').val(student.parents_email);

                    // Set the warden dropdown to the correct value
                    $('#warden').val(student.warden ? student.warden : 'not_a_hostler');
                } else {
                    alert('Failed to load student details: ' + response.message);
                }
            },
            error: function(error) {
                console.error('Error loading student details:', error);
                alert('Error loading student details.');
            }
        });
    }

    $('#edit-student-form').on('submit', function(event) {
        event.preventDefault();
    
        var wardenValue = $('#warden').val();
        var warden = (wardenValue === 'not_a_hostler') ? null : wardenValue;
    
        var studentData = {
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            gender: $('#gender').val(),
            admission_number: $('#admission_number').val(),
            roll_number: $('#roll_number').val(),
            parents_number: $('#parents_number').val(),
            parents_email: $('#parents_email').val(),
            warden: warden
        };
    
        $.ajax({
            url: '/management/api/edit_student/' + studentId + '/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(studentData),
            success: function(response) {
                if (response.success) {
                    alert('Student updated successfully.');
                    window.location.href = '/management/teacher_dashboard/';
                } else {
                    alert('Failed to update student: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error updating the student.');
                console.error(error);
            }
        });
    });

    fetchWardens(); // Fetch the list of wardens and then student details
});
