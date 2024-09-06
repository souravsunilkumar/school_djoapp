$(document).ready(function() {
    $('#generate_pdf').click(function() {
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
                generatePDF(response.attendance_list, startDate, endDate);
            },
            error: function() {
                alert('Failed to fetch attendance report.');
            }
        });
    });

    function generatePDF(attendanceList, startDate, endDate) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');

        // Title and Date Range
        doc.setFontSize(16);
        doc.text(`Attendance Report from ${startDate} to ${endDate}`, 14, 20);

        // Table Headers
        const headers = ["Roll Number", "Student Name"];
        const uniqueDates = [...new Set(attendanceList.flatMap(item => item.attendance.map(record => record.date)))];
        headers.push(...uniqueDates);

        const data = attendanceList.map(item => {
            const student = item.student;
            const row = [
                student.roll_number,
                `${student.first_name} ${student.last_name}`
            ];

            uniqueDates.forEach(date => {
                const record = item.attendance.find(r => r.date === date);
                const status = record ? record.status.charAt(0) : 'No Data';
                row.push(status);
            });

            return row;
        });

        // Define column widths, giving extra space for dynamic content
        const columnWidths = [20, 60].concat(new Array(uniqueDates.length).fill(15)); // Adjust these base widths as needed

        // Adjust total width
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        const pageWidth = doc.internal.pageSize.width - 20; // Page width minus margins
        if (totalWidth > pageWidth) {
            const scaleRatio = pageWidth / totalWidth;
            columnWidths.forEach((_, index) => {
                columnWidths[index] = columnWidths[index] * scaleRatio;
            });
        }

        // Generate Table
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 30,
            columnStyles: columnWidths.reduce((styles, width, index) => {
                styles[index] = { cellWidth: width };
                return styles;
            }, {}),
            styles: {
                cellPadding: 3,
                fontSize: 8,  // Font size for table cells
                overflow: 'linebreak',
                tableWidth: 'wrap',
                cellWidth: 'wrap',
            },
            headStyles: {
                fillColor: [255, 0, 0],  // Header background color
                fontSize: 6  // Font size for headers
            },
            cellStyles: {
                // Apply custom colors for status
                cellPadding: 3,
                fontSize: 8,
                overflow: 'linebreak',
                tableWidth: 'wrap',
                cellWidth: 'wrap',
                halign: 'center' // Center-align text in cells
            },
            margin: { left: 10, right: 10 }, // Adjust margins to fit content
            didParseCell: function(data) {
                if (data.column.index >= 2) { // Apply color to status columns
                    if (data.cell.text === 'P') {
                        data.cell.styles.fillColor = [0, 255, 0]; // Green
                    } else if (data.cell.text === 'H') {
                        data.cell.styles.fillColor = [0, 0, 255]; // Blue
                    } else if (data.cell.text === 'A') {
                        data.cell.styles.fillColor = [255, 0, 0]; // Red
                    }
                }
            }
        });

        // Save PDF
        doc.save(`Attendance_Report_${startDate}_to_${endDate}.pdf`);
    }
});
