$(document).ready(function () {
    // Fetch attendance on button click
    $('#fetch-attendance').click(function () {
        const fromDate = $('#from-date').val();
        const toDate = $('#to-date').val();

        if (!fromDate || !toDate) {
            alert("Please select both dates.");
            return;
        }

        $.ajax({
            url: '/admin_management/get_student_attendance/',
            type: 'GET',
            data: {
                student_id: studentId,  // Use the studentId variable defined in the template
                from_date: fromDate,
                to_date: toDate
            },
            success: function (data) {
                const attendanceList = $('#attendance-list');
                attendanceList.empty();

                if (data.attendance.length > 0) {
                    $('#no-attendance-message').hide();

                    data.attendance.forEach(function (record) {
                        const status = record.is_present === null ? 'Sunday' : (record.is_present ? 'Present' : 'Absent');
                        const reason = record.reason || 'N/A';

                        attendanceList.append(`
                            <tr>
                                <td>${record.date}</td>
                                <td>${status}</td>
                                <td>${reason}</td>
                            </tr>
                        `);
                    });
                } else {
                    $('#no-attendance-message').show();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching attendance:", error);
            }
        });
    });
});
