$(document).ready(function() {
    // Function to fetch and display the list of teachers in the dropdown
    function fetchTeachers() {
        $.ajax({
            url: '/management/api/get_teachers/', // Corrected API endpoint
            type: 'GET',
            contentType: 'application/json',
            success: function(response) {
                if (response.teachers) {
                    var teachersList = response.teachers;
                    var teacherDropdown = $('#teacher');

                    teacherDropdown.empty();
                    teacherDropdown.append('<option value="">Select Teacher</option>');

                    teachersList.forEach(function(teacher) {
                        teacherDropdown.append('<option value="' + teacher.id + '">' + teacher.full_name + '</option>');
                    });
                } else {
                    alert('Failed to load teachers: ' + response.error);
                }
            },
            error: function(error) {
                alert('There was an error loading the teachers.');
                console.error(error);
            }
        });
    }

    fetchTeachers();

    // Handle the form submission for assigning a teacher as a class teacher
    $('#assign-teacher-form').on('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        var teacherId = $('#teacher').val();
        var className = $('#class').val();
        var division = $('#division').val();

        var formData = {
            teacher: teacherId,
            class: className,
            division: division
        };

        $.ajax({
            url: '/management/api/assign_class_teacher/', // API endpoint to assign class teacher
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    alert('Teacher assigned as class teacher successfully.');
                } else {
                    alert('Assignment failed: ' + response.message);
                }
            },
            error: function(error) {
                alert('There was an error during assignment.');
                console.error(error);
            }
        });
    });
});
