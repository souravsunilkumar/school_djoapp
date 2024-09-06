$(document).ready(function() {
    $('#generate_report').click(function() {
        const startDate = $('#start_date').val();
        const endDate = $('#end_date').val();
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        $.ajax({
            url: '/attendance/api/view_attendance_report/',
            method: 'GET',
            data: {
                start_date: startDate,
                end_date: endDate
            },
            success: function(response) {
                // Update the report dates in the header
                $('#report-start-date').text(startDate);
                $('#report-end-date').text(endDate);

                // Clear the table body and header
                const tbody = $('#attendance-report tbody');
                tbody.empty();
                const thead = $('#attendance-report thead tr');
                thead.find('th:gt(4)').remove(); // Remove dynamically added date columns

                // Extract all unique dates
                const dates = new Set();
                response.attendance_list.forEach(item => {
                    item.attendance.forEach(record => {
                        dates.add(record.date);
                    });
                });

                const uniqueDates = Array.from(dates);

                // Sort dates in chronological order
                uniqueDates.sort((a, b) => {
                    const [dayA, monthA, yearA] = a.split('/').map(Number);
                    const [dayB, monthB, yearB] = b.split('/').map(Number);
                    const dateA = new Date(yearA, monthA - 1, dayA);
                    const dateB = new Date(yearB, monthB - 1, dayB);
                    return dateA - dateB;
                });

                // Add date columns to the table header
                uniqueDates.forEach(date => {
                    thead.append(`<th>${date}</th>`);
                });

                // Populate the table with attendance data
                response.attendance_list.forEach(item => {
                    const tr = $('<tr></tr>');
                    const student = item.student;
                    const attendance = item.attendance;

                    tr.append(`<td class="sticky-column">${student.first_name} ${student.last_name}</td>`);
                    tr.append(`<td>${student.admission_number}</td>`);
                    tr.append(`<td>${student.roll_number}</td>`);
                    tr.append(`<td>${student.class_assigned}</td>`);
                    tr.append(`<td>${student.division_assigned}</td>`);
                    
                    uniqueDates.forEach(date => {
                        const record = attendance.find(r => r.date === date);
                        const status = record ? record.status : 'No Data';
                        let statusClass = '';
                        if (status === 'Present') {
                            statusClass = 'status-present';
                        } else if (status === 'Absent') {
                            statusClass = 'status-absent';
                        } else if (status === 'Holiday (Sunday)') {
                            statusClass = 'status-holiday';
                        }
                        tr.append(`<td class="${statusClass}">${status.charAt(0)}</td>`);
                    });
                    
                    tbody.append(tr);
                });
            },
            error: function() {
                alert('Failed to fetch attendance report.');
            }
        });
    });

    $('#download_pdf').click(function() {
        const startDate = $('#start_date').val();
        const endDate = $('#end_date').val();
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        window.location.href = `/attendance/attendance_report_pdf/?start_date=${startDate}&end_date=${endDate}`;
    });

    $('#download_csv').click(function() {
        const startDate = $('#start_date').val();
        const endDate = $('#end_date').val();
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        window.location.href = `/attendance/download_attendance_report_csv/?start_date=${startDate}&end_date=${endDate}`;
    });
});
