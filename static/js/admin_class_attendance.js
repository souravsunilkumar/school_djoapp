$(document).ready(function() {
    const attendanceForm = $('#attendanceForm');
    const classSelect = $('#classSelect');
    const divisionSelect = $('#divisionSelect');
    const attendanceTable = $('#attendanceTable');

    // Fetch classes linked to the school admin
    $.ajax({
        url: '/admin_management/api/get-classes-divisions/',
        method: 'GET',
        success: function(data) {
            data.classes.forEach(function(item) {
                classSelect.append(new Option(item.class_assigned, item.class_assigned));
            });
        },
        error: function(error) {
            console.error('Error fetching classes:', error);
        }
    });

    // When a class is selected, fetch corresponding divisions
    classSelect.change(function() {
        const selectedClass = classSelect.val();

        // Clear current division options
        divisionSelect.empty().append('<option value="" disabled selected>Select Division</option>');

        // Fetch divisions for the selected class
        $.ajax({
            url: '/admin_management/api/get-divisions/',
            method: 'GET',
            data: {
                class_assigned: selectedClass
            },
            success: function(data) {
                data.divisions.forEach(function(item) {
                    divisionSelect.append(new Option(item.division_assigned, item.division_assigned));
                });
            },
            error: function(error) {
                console.error('Error fetching divisions:', error);
            }
        });
    });

    // Form submission to fetch attendance data
    attendanceForm.submit(function(event) {
        event.preventDefault();

        const classAssigned = classSelect.val();
        const divisionAssigned = divisionSelect.val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        // Fetch attendance data
        $.ajax({
            url: `/admin_management/api/get-attendance/`,
            method: 'GET',
            data: {
                class_assigned: classAssigned,
                division_assigned: divisionAssigned,
                start_date: startDate,
                end_date: endDate
            },
            success: function(data) {
                // Clear previous table data
                attendanceTable.find('thead tr th').slice(5).remove(); // Remove old date headers
                attendanceTable.find('tbody').empty();

                if (data.attendance_list.length > 0) {
                    // Dynamically add date headers
                    const dateHeaders = data.attendance_list[0].attendance.map(entry => `<th>${entry.date}</th>`);
                    attendanceTable.find('thead tr').append(dateHeaders.join(''));

                    // Populate attendance data
                    data.attendance_list.forEach(function(att) {
                        const studentRow = `
                            <tr>
                                <td>${att.student.first_name} ${att.student.last_name}</td>
                                <td>${att.student.admission_number}</td>
                                <td>${att.student.roll_number}</td>
                                <td>${att.student.class_assigned}</td>
                                <td>${att.student.division_assigned}</td>
                                ${att.attendance.map(entry => `<td>${entry.status}</td>`).join('')}
                            </tr>
                        `;
                        attendanceTable.find('tbody').append(studentRow);
                    });
                } else {
                    // If no attendance data found, display a message
                    attendanceTable.find('tbody').append('<tr><td colspan="100%">No attendance data available</td></tr>');
                }
            },
            error: function(error) {
                console.error('Error fetching attendance:', error);
            }
        });
    });
});
