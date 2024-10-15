$(document).ready(function () {
    var examModal = $('#examModal');
    var openExamModalBtn = $('#openExamModalBtn');
    var addTimetableBtn = $('#addTimetableBtn');
    var timetableForm = $('#timetableForm');
    var closeBtn = $('.close');

    // Open the exam modal
    openExamModalBtn.on('click', function () {
        examModal.fadeIn();
        loadAcademicYears('#academicYearSelect'); // Load academic years for exam modal
    });

    // Open the timetable form
    addTimetableBtn.on('click', function () {
        timetableForm.fadeIn();
        loadAcademicYears('#academicYearSelectSubject'); // Load academic years for timetable form
    });

    // Close the modals
    closeBtn.on('click', function () {
        var modalId = $(this).data('modal');
        $('#' + modalId).fadeOut();
    });

    // Load academic years for the given select element
    function loadAcademicYears(selectId) {
        $.ajax({
            url: '/management/get_academic_years/',
            type: 'GET',
            success: function (response) {
                var selectElement = $(selectId);
                selectElement.empty();
                selectElement.append('<option value="" disabled selected>Select Academic Year</option>');

                if (Array.isArray(response.academic_years)) {
                    $.each(response.academic_years, function (index, year) {
                        selectElement.append('<option value="' + year + '">' + year + '</option>');
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching academic years:", error);
            }
        });
    }

    // Load exams based on the selected academic year
    $('#academicYearSelectSubject').on('change', function () {
        var selectedYear = $(this).val();
        loadExams(selectedYear);
    });

    function loadExams(academicYear) {
        $.ajax({
            url: '/management/get_exams/?academic_year=' + academicYear,
            type: 'GET',
            success: function (response) {
                var examSelect = $('#examSelect');
                examSelect.empty();
                examSelect.append('<option value="" disabled selected>Select Exam</option>');

                if (Array.isArray(response.exams)) {
                    $.each(response.exams, function (index, exam) {
                        examSelect.append('<option value="' + exam.exam_id + '">' + exam.exam_name + '</option>');
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching exams:", error);
            }
        });
    }

    // Generate subject details based on the number of subjects
    $('#numSubjects').on('change', function () {
        var numSubjects = $(this).val();
        generateSubjectFields(numSubjects);
    });

    function generateSubjectFields(numSubjects) {
        var subjectDetailsDiv = $('#subjectDetails');
        subjectDetailsDiv.empty(); // Clear previous fields

        for (var i = 0; i < numSubjects; i++) {
            subjectDetailsDiv.append(`
                <table class="exam-timetable">
                <thead>
                <tr>
                <th>Subject Name</th>
                <th>Exam Date</th>
                <th>Exam Time</th>
                </tr>
                </thead>
                <tbody>
                <tr class="subject-row">
                <td><input type="text" id="subject_${i}" name="subjects[${i}][subject]" required placeholder="Enter Subject Name"></td>
                <td><input type="date" id="exam_date_${i}" name="subjects[${i}][exam_date]" required></td>
                <td><input type="text" id="exam_time_${i}" name="subjects[${i}][exam_time]" required placeholder="Enter Exam Time"></td>
                </tr>
                </tbody>
                </table>
            `);
        }
    }

    // Handle timetable form submission
    $('#addTimetableForm').on('submit', function (e) {
        e.preventDefault(); // Prevent default form submission

        var academicYear = $('#academicYearSelectSubject').val();
        var examId = $('#examSelect').val();
        var subjectsData = [];

        // Loop over the dynamically generated fields to gather subject data
        $('#subjectDetails .subject-row').each(function () {
            var subjectData = {
                'subject': $(this).find('[name*="subject"]').val(), // Ensure this captures the subject name
                'exam_date': $(this).find('[name*="exam_date"]').val(),
                'exam_time': $(this).find('[name*="exam_time"]').val()
            };
            subjectsData.push(subjectData);
        });

        // Log the data being sent for debugging
        console.log('Submitting data:', {
            'academic_year': academicYear,
            'exam_id': examId,
            'subjects': subjectsData
        });

        $.ajax({
            url: '/management/add_exam_timetable/',
            type: 'POST',
            headers: {
                'X-CSRFToken': $('#csrfToken').val()
            },
            contentType: 'application/json',  // Ensure content is sent as JSON
            data: JSON.stringify({
                'academic_year': academicYear,
                'exam_id': examId,
                'subjects': subjectsData
            }),
            success: function (response) {
                if (response.success) {
                    alert('Exam timetable added successfully!');
                    timetableForm.fadeOut();
                    $('#addTimetableForm')[0].reset();
                } else {
                    alert('Error: ' + response.error);
                }
            },
            error: function (xhr, status, error) {
                alert('An error occurred: ' + error);
            }
        });
    });
});
