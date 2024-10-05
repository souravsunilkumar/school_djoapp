$(document).ready(function () {
    // Fetch classes and divisions for the logged-in school_admin
    $.ajax({
        url: '/admin_management/get_classes_and_divisions/',
        type: 'GET',
        success: function (data) {
            // Populate the class dropdown
            data.classes.forEach(function (classItem) {
                const class_assigned = classItem.class_assigned;
                const division_assigned = classItem.division_assigned;
                $('#class-select').append(
                    `<option value="${class_assigned}-${division_assigned}">${class_assigned} ${division_assigned}</option>`
                );
            });
        },
        error: function (xhr, status, error) {
            console.error("Error fetching classes:", error);
        }
    });

    // Fetch students when a class is selected
    $('#class-select').change(function () {
        let selectedClass = $(this).val();
        let [class_assigned, division_assigned] = selectedClass.split('-');

        $.ajax({
            url: '/admin_management/get_students/',
            type: 'GET',
            data: {
                class_assigned: class_assigned,
                division_assigned: division_assigned
            },
            success: function (data) {
                // Clear previous student list
                $('#students-list').empty();

                if (data.students.length > 0) {
                    // Hide "No students" message if students are available
                    $('#no-students-message').hide();

                    // Populate the students list in the table
                    data.students.forEach(function (student) {
                        $('#students-list').append(`
                            <tr>
                                <td>${student.roll_number}</td>
                                <td>${student.first_name}</td>
                                <td>${student.last_name}</td>
                                <td>
                                    <button class="view-marks" onclick="viewMarks(${student.id})">View Marks</button><br><br>
                                    <button class="view-attendance" onclick="viewAttendance(${student.id})">View Attendance</button>
                                </td>
                            </tr>
                        `);
                    });
                } else {
                    // Show "No students" message
                    $('#no-students-message').show();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching students:", error);
            }
        });
    });
});

// Function to handle "View Marks"
function viewMarks(studentId) {
    // Construct the URL for viewing marks
    const url = `/admin_management/admin_view_marks_page/${studentId}/`; // Add student ID as a path parameter
    window.location.href = url; // Redirect to the marks page
}

// Function to handle "View Attendance"
function viewAttendance(studentId) {
    // Construct the URL for viewing attendance
    const url = `/admin_management/admin_student_attendance_page?student_id=${studentId}`; // Add student ID as a query parameter
    window.location.href = url; // Redirect to the attendance page
}
