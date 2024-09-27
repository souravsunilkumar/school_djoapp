$(document).ready(function () {
    // Function to get the student ID from the URL path
    function getStudentIdFromPath() {
        const pathArray = window.location.pathname.split('/');
        return pathArray[pathArray.length - 2]; // Get the second last item in the path
    }

    // Get the student ID from the URL
    const studentId = getStudentIdFromPath();

    console.log("Student ID from URL:", studentId); // Log the student ID

    if (studentId) {
        // Fetch the student's marks
        $.ajax({
            url: '/admin_management/get_student_marks/',
            type: 'GET',
            data: { student_id: studentId },
            success: function (data) {
                // Set student name if you are fetching it
                $('#student-name').text(data.student_name); // Uncomment this if you are sending student name in JSON response

                // Clear previous marks list
                $('#marks-list').empty();

                if (data.marks.length > 0) {
                    // Hide "No marks" message if marks are available
                    $('#no-marks-message').hide();

                    // Group marks by exam
                    const groupedMarks = {};
                    data.marks.forEach(function (mark) {
                        const examName = mark.exam__exam_name;

                        // Initialize an array for this exam if it doesn't exist
                        if (!groupedMarks[examName]) {
                            groupedMarks[examName] = [];
                        }

                        // Push the mark into the appropriate exam array
                        groupedMarks[examName].push(mark);
                    });

                    // Create tables for each exam
                    for (const exam in groupedMarks) {
                        const marksForExam = groupedMarks[exam];
                        const tableId = `table-${exam.replace(/\s+/g, '-')}`; // Replace spaces with hyphens for valid ID

                        // Create a new table for this exam
                        $('#marks-list').append(`
                            <h2>${exam}</h2>
                            <table id="${tableId}" border="1" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Marks Obtained</th>
                                        <th>Out Of</th>
                                    </tr>
                                </thead>
                                <tbody id="marks-${tableId}">
                                    <!-- Marks details will be populated here -->
                                </tbody>
                            </table>
                        `);

                        // Populate the table with marks
                        marksForExam.forEach(function (mark) {
                            $(`#marks-${tableId}`).append(`
                                <tr>
                                    <td>${mark.subject__subject_name}</td>
                                    <td>${mark.marks_obtained}</td>
                                    <td>${mark.out_of}</td>
                                </tr>
                            `);
                        });
                    }
                } else {
                    // Show "No marks" message
                    $('#no-marks-message').show();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching student marks:", error);
            }
        });
    } else {
        alert("No student selected.");
    }
});
