$(document).ready(function() {
    // Function to fetch the timetables from the server
    function loadTimetables() {
        $.ajax({
            url: '/parent/get_exam_timetables/',
            method: 'GET',
            success: function(response) {
                var timetables = response.timetables;
                var examList = $('#exam-list');
                examList.empty(); // Clear previous content

                // Check if there are timetables to display
                if (timetables.length === 0) {
                    examList.append('<div>No exam timetables found for the students.</div>');
                    return;
                }

                // Loop through the timetables and append each exam and academic year to the list
                timetables.forEach(function(item) {
                    var examItem = $('<div class="exam-item"></div>')
                        .text(item.exam__exam_name + ' (' + item.academic_year + ')')
                        .data('exam-name', item.exam__exam_name)
                        .data('academic-year', item.academic_year)
                        .css('cursor', 'pointer'); // Make it look clickable
                    
                    // Append click event
                    examItem.on('click', function() {
                        loadExamDetails($(this).data('exam-name'), $(this).data('academic-year'));
                    });

                    examList.append(examItem);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching timetables:', error);
                $('#exam-list').append('<div>Error loading timetables. Please try again later.</div>');
            }
        });
    }

    // Function to load details for a specific exam and academic year
    function loadExamDetails(examName, academicYear) {
        $.ajax({
            url: '/parent/get_exam_details/',
            method: 'GET',
            data: {
                exam_name: examName,
                academic_year: academicYear
            },
            success: function(response) {
                var examDetails = response.details;
                var examDetailsBody = $('#exam-details');
                examDetailsBody.empty(); // Clear previous content

                // Check if there are details to display
                if (examDetails.length === 0) {
                    examDetailsBody.append('<tr><td colspan="3">No details found for this exam.</td></tr>');
                    return;
                }

                // Loop through and display the details in a table format
                examDetails.forEach(function(detail) {
                    var detailRow = $('<tr></tr>').append(
                        $('<td></td>').text(detail.exam_date),  // Date in dd/mm/yyyy format
                        $('<td></td>').text(detail.subject),
                        $('<td></td>').text(detail.exam_time)
                    );
                    examDetailsBody.append(detailRow);
                });

                // Show the modal
                $('#examModal').show();
            },
            error: function(xhr, status, error) {
                console.error('Error fetching exam details:', error);
                $('#exam-details').append('<tr><td colspan="3">Error loading exam details. Please try again later.</td></tr>');
            }
        });
    }

    // Initial load
    loadTimetables();

});
