$(document).ready(function () {
    // Function to get CSRF token
    function getCSRFToken() {
        return $('#csrf-token').val();
    }

    // Load teacher data on page load
    function loadTeachers() {
        $.ajax({
            url: '/admin_management/get_teachers/',
            method: 'GET',
            success: function (data) {
                const teachersTable = $('#teachers-table tbody');
                teachersTable.empty();

                if (data.teachers.length > 0) {
                    data.teachers.forEach(function (teacher) {
                        let classTeacherInfo = teacher.is_class_teacher
                            ? `${teacher.class_assigned} - ${teacher.division_assigned}`
                            : "N/A";

                        const teacherRow = `
                            <tr class="teacher-item" data-teacher-id="${teacher.id}">
                                <td>${teacher.first_name}</td>
                                <td>${teacher.last_name}</td>
                                <td>${teacher.designation}</td>
                                <td>${classTeacherInfo}</td>
                                <td>
                                    <button class="edit-teacher-btn" data-teacher-id="${teacher.id}">Edit</button>
                                    <button class="delete-teacher-btn">Delete</button>
                                </td>
                            </tr>
                        `;
                        teachersTable.append(teacherRow);
                    });
                } else {
                    teachersTable.append('<tr><td colspan="5">No teachers available.</td></tr>');
                }
            },
            error: function (error) {
                console.error('Error fetching teachers:', error);
            }
        });
    }

    // Redirect to edit teacher page when edit button is clicked
    $(document).on('click', '.edit-teacher-btn', function () {
        const teacherId = $(this).data('teacher-id');
        window.location.href = `/admin_management/edit_teacher_page/${teacherId}/`;
    });

    // Handle deleting a teacher
    $(document).on('click', '.delete-teacher-btn', function () {
        const teacherId = $(this).closest('.teacher-item').data('teacher-id');
        $('#delete-teacher-modal').show();
        $('#confirm-delete').data('teacher-id', teacherId);
    });

    $('#confirm-delete').on('click', function () {
        const teacherId = $(this).data('teacher-id');

        $.ajax({
            url: `/admin_management/delete_teacher/${teacherId}/`,
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            success: function () {
                loadTeachers(); // Reload the teacher list after deletion
                $('#delete-teacher-modal').hide();
            },
            error: function (error) {
                console.error('Error deleting teacher:', error);
            }
        });
    });

    $('#cancel-delete').on('click', function () {
        $('#delete-teacher-modal').hide();
    });

    // Load teachers on page load
    loadTeachers();
});
