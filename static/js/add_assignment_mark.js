$(document).ready(function () {
    const assignmentId = $('#assignment_id').val(); // Fetch the value

    function loadAssignmentDetails() {
        $.ajax({
            url: `/management/get_assignment_details/${assignmentId}/`,
            method: 'GET',
            success: function (data) {
                $('#assignment_title').text(data.title);
                $('#assignment_description').text(data.description);
                $('#assignment_class').text(data.class_assigned);
                $('#assignment_division').text(data.division_assigned);
                $('#assignment_due_date').text(data.due_date);

                // Fetch class_assigned and division_assigned after they are loaded
                const classAssigned = data.class_assigned;  // Get class assigned
                const divisionAssigned = data.division_assigned;  // Get division assigned

                // Log values for debugging
                console.log('Class Assigned:', classAssigned);
                console.log('Division Assigned:', divisionAssigned);

                // Now load students after the class and division are available
                loadStudents(classAssigned, divisionAssigned);
            },
            error: function (error) {
                console.error('Error fetching assignment details:', error);
            }
        });
    }

    function loadStudents(classAssigned, divisionAssigned) {
        $.ajax({
            url: `/management/get_assignment_students/${classAssigned}/${divisionAssigned}/${assignmentId}/`,
            method: 'GET',
            success: function (data) {
                const tbody = $('#student_assignment_marks tbody');
                tbody.empty();

                if (data.students && data.students.length > 0) {
                    data.students.forEach(function (student) {
                        const submissionDate = student.submission_date ? student.submission_date : ''; // Editable field
                        const marksObtained = student.marks_obtained || ''; // Use consistent naming
                        const totalMarks = student.total_marks || '';

                        const rowHtml = `
                            <tr>
                                <td>${student.roll_number}</td>
                                <td>${student.first_name} ${student.last_name}</td>
                                <td><input type="checkbox" class="submitted-checkbox" data-student-id="${student.id}" ${student.is_submitted ? 'checked' : ''} /></td>
                                <td><input type="number" class="marks-obtained" data-student-id="${student.id}" value="${marksObtained}" /></td>
                                <td><input type="number" class="total-marks" data-student-id="${student.id}" value="${totalMarks}" /></td>
                                <td><input type="date" class="submission-date" data-student-id="${student.id}" value="${submissionDate}" /></td> <!-- Editable date field -->
                            </tr>
                        `;
                        tbody.append(rowHtml);
                    });
                } else {
                    tbody.append('<tr><td colspan="6">No students found for this class and division.</td></tr>');
                    console.log(`Class: ${classAssigned}, Division: ${divisionAssigned}, Assignment ID: ${assignmentId}`);
                }
            },
            error: function (error) {
                console.error('Error fetching students:', error);
            }
        });
    }

    $('#submit_marks_btn').on('click', function () {
        const submissionData = [];

        $('#student_assignment_marks tbody tr').each(function () {
            const studentId = $(this).find('.submitted-checkbox').data('student-id');
            const isSubmitted = $(this).find('.submitted-checkbox').is(':checked');
            const marksObtained = $(this).find('.marks-obtained').val();
            const totalMarks = $(this).find('.total-marks').val();
            const submissionDate = $(this).find('.submission-date').val();  // Capture editable date field

            submissionData.push({
                student_id: studentId,
                is_submitted: isSubmitted,
                marks_obtained: marksObtained || 0,
                total_marks: totalMarks || 0,
                submission_date: submissionDate || null,  // Set submission date or null if not provided
            });
        });

        $.ajax({
            url: `/management/submit_assignment_marks/${assignmentId}/`,
            method: 'POST',
            data: JSON.stringify({ submissions: submissionData }),
            contentType: 'application/json',
            success: function (response) {
                alert('Marks submitted successfully!');
                loadAssignmentDetails(); // Reload the details after submission
            },
            error: function (error) {
                console.error('Error submitting marks:', error);
            }
        });
    });

    // Initial load
    loadAssignmentDetails();
});
