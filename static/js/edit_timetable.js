$(document).ready(function () {
    // Load the available exams for the logged-in teacher's class
    $.ajax({
        url: '/management/fetch_timetables/',
        method: 'GET',
        success: function (response) {
            var timetables = response.timetables;
            var examSelect = $('#exam-select');

            // Populate the exam select dropdown
            timetables.forEach(function (item) {
                examSelect.append('<option value="' + item.exam__exam_name + '" data-academic-year="' + item.academic_year + '">' + item.exam__exam_name + ' (' + item.academic_year + ')</option>');
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching timetables:', error);
        }
    });

    // Fetch exam details and timetable on exam selection
    $('#exam-select').on('change', function () {
        var selectedExam = $(this).val();
        var selectedOption = $(this).find('option:selected');
        var academicYear = selectedOption.data('academic-year');

        $('#academic-year').val(academicYear); // Set academic year input field
        fetchTimetableData(selectedExam, academicYear); // Fetch timetable data
    });

    // Function to fetch timetable data
    function fetchTimetableData(exam, academicYear) {
        $.ajax({
            url: '/management/fetch_timetable_data/',
            method: 'GET',
            data: {
                exam_name: exam,
                academic_year: academicYear
            },
            success: function (response) {
                var tbody = $('#timetable-table tbody');
                tbody.empty(); // Clear existing table rows

                response.timetables.forEach(function (item) {
                    var row = `<tr>
                        <td><input type="text" name="subject" value="${item.subject}"></td>
                        <td><input type="date" name="exam_date" value="${item.exam_date}"></td>
                        <td><input type="text" name="exam_time" value="${item.exam_time}"></td>
                        <input type="hidden" name="id" value="${item.id}">
                    </tr>`;
                    tbody.append(row);
                });
            },
            error: function (xhr, status, error) {
                console.error('Error fetching timetable data:', error);
            }
        });
    }

    // Add new row for adding a new timetable instance
    $('#add-row-btn').on('click', function () {
        var tbody = $('#timetable-table tbody');
        var newRow = `<tr>
            <td><input type="text" name="subject" placeholder="New Subject"></td>
            <td><input type="date" name="exam_date"></td>
            <td><input type="text" name="exam_time" placeholder="Exam Time"></td>
        </tr>`;
        tbody.append(newRow);
    });

    // Submit updated timetable including new rows
    $('#update-timetable-btn').on('click', function () {
        var exam = $('#exam-select').val();
        var academicYear = $('#academic-year').val();
        var timetableData = [];

        $('#timetable-table tbody tr').each(function () {
            var row = $(this);
            var subject = row.find('input[name="subject"]').val();
            var examDate = row.find('input[name="exam_date"]').val();
            var examTime = row.find('input[name="exam_time"]').val();
            var id = row.find('input[name="id"]').val(); // Optional for existing rows

            timetableData.push({
                id: id,
                subject: subject,
                exam_date: examDate,
                exam_time: examTime
            });
        });

        $.ajax({
            url: '/management/update_timetable/',
            method: 'POST',
            data: JSON.stringify({
                exam_name: exam,
                academic_year: academicYear,
                timetable_data: timetableData
            }),
            contentType: 'application/json',
            success: function (response) {
                alert('Timetable updated successfully!');
                // Optionally reload the timetable
                fetchTimetableData(exam, academicYear);
            },
            error: function (xhr, status, error) {
                console.error('Error updating timetable:', error);
            }
        });
    });
});
