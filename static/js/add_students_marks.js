$(document).ready(function () {
    // Utility function to get CSRF token from the form
    function getCSRFToken() {
        return $('input[name="csrfmiddlewaretoken"]').val();
    }

    // Show the modal when the button is clicked
    $('#openModalButton').on('click', function() {
        $('#addExamModal').show();
    });

    // Close the modal when the 'X' is clicked
    $('#closeModalButton').on('click', function() {
        $('#addExamModal').hide();
    });

    // Close the modal when clicking outside the modal content
    $(window).on('click', function(event) {
        if ($(event.target).is('#addExamModal')) {
            $('#addExamModal').hide();
        }
    });

    // Fetch existing exams linked to the school
    function fetchExams() {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_exams/', // Your endpoint to get the exams
            success: function (response) {
                var exams = response.exams;
                var examDropdown = $('#existing_exam');
                examDropdown.empty().append('<option value="">Select an exam</option>');

                exams.forEach(function (exam) {
                    examDropdown.append('<option value="' + exam.id + '">' + exam.name + '</option>');
                });
            },
            error: function (xhr, status, error) {
                $('#message').text('Error fetching exams.').show();
            }
        });
    }

    // Call the function to fetch exams when the page loads
    fetchExams();

    // Update exam_id hidden field when an exam is selected
    $('#existing_exam').on('change', function () {
        $('#exam_id').val($(this).val());
    });

    // Submit form for adding or selecting an exam
    $('#add_exam_form').on('submit', function (e) {
        e.preventDefault();

        var examName = $('#exam_name').val();
        var selectedExam = $('#existing_exam').val();

        if (examName && selectedExam) {
            $('#message').text('Please either select an existing exam or add a new one, not both.').show();
            return;
        }

        var examData = selectedExam ? { 'exam_id': selectedExam } : { 'exam_name': examName };

        $.ajax({
            type: 'POST',
            url: '/management/exam/add_exam_or_select/',
            data: {
                ...examData,
                'csrfmiddlewaretoken': getCSRFToken()
            },
            success: function (response) {
                $('#message').text(response.message).show();
                $('#add_exam_form')[0].reset();
                $('#existing_exam').val('');
            },
            error: function (xhr, status, error) {
                $('#message').text('Error processing exam.').show();
            }
        });
    });

    // Fetch classes and populate class dropdown
    function fetchClasses() {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_classes_and_divisions/',
            success: function (response) {
                var classes = response.classes;
                var classDropdown = $('#class_assigned');

                classDropdown.empty().append('<option value="">Select Class</option>');

                classes.forEach(function (cls) {
                    classDropdown.append('<option value="' + cls.class_assigned + '">' + cls.class_assigned + '</option>');
                });
            },
            error: function (xhr, status, error) {
                $('#message_subject').text('Error fetching classes.').show();
            }
        });
    }

    // Fetch divisions based on selected class
    function fetchDivisions(classAssigned) {
        $.ajax({
            type: 'GET',
            url: '/management/exam/get_classes_and_divisions/',
            data: { class_id: classAssigned },
            success: function (response) {
                var divisions = response.divisions;
                var divisionDropdown = $('#division_assigned');

                divisionDropdown.empty().append('<option value="">Select Division</option>');

                divisions.forEach(function (div) {
                    divisionDropdown.append('<option value="' + div.division_assigned + '">' + div.division_assigned + '</option>');
                });
            },
            error: function (xhr, status, error) {
                $('#message_subject').text('Error fetching divisions.').show();
            }
        });
    }

    // Call the function to fetch classes when the page loads
    fetchClasses();

    // Fetch divisions when a class is selected
    $('#class_assigned').on('change', function () {
        var selectedClass = $(this).val();
        if (selectedClass) {
            fetchDivisions(selectedClass);
        } else {
            $('#division_assigned').empty().append('<option value="">Select Division</option>');
        }
    });

    // Submit form for adding a subject
    $('#add_subject_form').on('submit', function (e) {
        e.preventDefault();

        var subjectName = $('#subject_name').val();
        var selectedClass = $('#class_assigned').val();
        var selectedDivision = $('#division_assigned').val();
        var examId = $('#exam_id').val();

        if (!subjectName || !selectedClass || !selectedDivision || !examId) {
            $('#message_subject').text('Please fill all fields.').show();
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/management/exam/add_subject/',
            data: {
                'subject_name': subjectName,
                'class_id': selectedClass,
                'division_id': selectedDivision,
                'exam_id': examId,
                'csrfmiddlewaretoken': getCSRFToken()
            },
            success: function (response) {
                $('#message_subject').text(response.message).show();
                $('#add_subject_form')[0].reset();
            },
            error: function (xhr, status, error) {
                $('#message_subject').text('Error adding subject.').show();
            }
        });
    });
});
