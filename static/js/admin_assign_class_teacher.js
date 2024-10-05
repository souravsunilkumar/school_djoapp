$(document).ready(function() {
    // Initialize select2 with search and display all teachers initially
    $('#teacher').select2({
        placeholder: 'Select a Teacher',
        width: '100%',
        ajax: {
            url: '/management/api/get_teachers/',
            dataType: 'json',
            delay: 250,
            data: function(params) {
                return {
                    search: params.term || ''  // Empty string if no search term, fetch all teachers
                };
            },
            processResults: function(data) {
                if (data.teachers) {
                    return {
                        results: data.teachers.map(function(teacher) {
                            return {
                                id: teacher.id,
                                text: teacher.full_name
                            };
                        })
                    };
                } else {
                    console.error("No teachers found or invalid data format:", data);
                    return {
                        results: []
                    };
                }
            },
            cache: true
        }
    });

    // Handle form submission for assigning the teacher
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
            url: '/management/api/assign_class_teacher/',
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
