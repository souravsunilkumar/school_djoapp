$(document).ready(function () {
    // Fetch students of the logged-in class teacher on page load
    $.ajax({
        url: '/attendance/api/get_class_students/', // API to fetch students from the class of logged-in teacher
        method: 'GET',
        success: function (data) {
            let studentSelect = $('#student-select');
            data.students.forEach(student => {
                studentSelect.append(`<option value="${student.id}">${student.first_name} ${student.last_name}</option>`);
            });

            // Load previously selected student and date range if available
            let savedStudentId = localStorage.getItem('studentId');
            let savedFromDate = localStorage.getItem('fromDate');
            let savedToDate = localStorage.getItem('toDate');

            if (savedStudentId) {
                studentSelect.val(savedStudentId).change();
            }
            if (savedFromDate) {
                $('#from-date').val(savedFromDate);
            }
            if (savedToDate) {
                $('#to-date').val(savedToDate);
            }
        }
    });

    // Show date range section and view attendance button when a student is selected
    $('#student-select').change(function () {
        let studentId = $(this).val();
        if (studentId) {
            $('#date-range-section').show();
            $('#view-attendance-btn').show();
        } else {
            $('#date-range-section').hide();
            $('#view-attendance-btn').hide();
            $('#attendance-result').hide();
        }
    });

    // Handle view attendance button click
    $('#view-attendance-btn').click(function () {
        let studentId = $('#student-select').val();
        let fromDate = $('#from-date').val();
        let toDate = $('#to-date').val();

        if (studentId && fromDate && toDate) {
            $.ajax({
                url: `/attendance/api/get_student_attendance/?student_id=${studentId}&from_date=${fromDate}&to_date=${toDate}`,
                method: 'GET',
                success: function (data) {
                    let attendanceTableBody = $('#attendance-table tbody');
                    attendanceTableBody.empty();

                    data.attendance.forEach(item => {
                        let attendanceStatus = 'Present';
                        let className = 'present'; // Default class for present
                        if (item.is_present === false) {
                            attendanceStatus = 'Absent';
                            className = 'absent';
                        } else if (item.is_present === null) {
                            attendanceStatus = 'Sunday'; // Display Sunday for Sunday dates
                            className = 'sunday';
                        }
                        
                        let reason = item.reason ? item.reason : 'N/A';
                        let reasonClass = item.reason ? 'reason' : ''; // Add class if reason is present
                        attendanceTableBody.append(`
                            <tr class="animate-row">
                                <td>${item.date}</td>
                                <td class="${className}">${attendanceStatus}</td>
                                <td class="${reasonClass}">${reason}</td>
                            </tr>
                        `);
                    });

                    // Show attendance result
                    $('#attendance-result').show();

                    // Save selected student and date range to local storage
                    localStorage.setItem('studentId', studentId);
                    localStorage.setItem('fromDate', fromDate);
                    localStorage.setItem('toDate', toDate);
                },
                error: function () {
                    alert('Failed to fetch attendance data.');
                }
            });
        } else {
            alert('Please select a student and date range.');
        }
    });
});
