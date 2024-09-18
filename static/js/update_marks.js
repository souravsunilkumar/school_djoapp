$(document).ready(function () {
    var academicYearSelect = $('#academicYearSelect');
    var examSelect = $('#examSelect');
    var classSelect = $('#classSelect');
    var divisionSelect = $('#divisionSelect');
    var subjectSelect = $('#subjectSelect');
    var studentsTable = $('#studentsTable');
    var csrfToken = $('#csrfToken').val();
    var totalMarksInput = $('#totalMarks');

    // Load academic years
    $.ajax({
        url: '/management/get_academic_years/',
        type: 'GET',
        success: function (response) {
            academicYearSelect.empty().append('<option value="" disabled selected>Select Academic Year</option>');
            $.each(response.academic_years, function (index, year) {
                academicYearSelect.append('<option value="' + year + '">' + year + '</option>');
            });
        },
        error: function (xhr, status, error) {
            console.error("Error fetching academic years:", error);
        }
    });

    // Load exams based on selected academic year
    academicYearSelect.on('change', function () {
        var academicYear = $(this).val();
        $.ajax({
            url: '/management/get_exams/',
            data: { academic_year: academicYear },
            type: 'GET',
            success: function (response) {
                examSelect.empty().append('<option value="" disabled selected>Select Exam</option>');
                $.each(response.exams, function (index, exam) {
                    examSelect.append('<option value="' + exam.exam_id + '">' + exam.exam_name + '</option>');
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching exams:", error);
            }
        });
    });

    // Load classes based on selected exam
    examSelect.on('change', function () {
        var examId = $(this).val();
        $.ajax({
            url: '/management/get_classes_and_divisions/',
            type: 'GET',
            success: function (response) {
                classSelect.empty().append('<option value="" disabled selected>Select Class</option>');
                $.each(response.classes, function (index, cls) {
                    classSelect.append('<option value="' + cls.class_assigned + '">' + cls.class_assigned + '</option>');
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching classes:", error);
            }
        });
    });

    // Load divisions based on selected class
    classSelect.on('change', function () {
        var classAssigned = $(this).val();
        $.ajax({
            url: '/management/get_classes_and_divisions/',
            data: { class_id: classAssigned },
            type: 'GET',
            success: function (response) {
                divisionSelect.empty().append('<option value="" disabled selected>Select Division</option>');
                $.each(response.divisions, function (index, div) {
                    divisionSelect.append('<option value="' + div.division_assigned + '">' + div.division_assigned + '</option>');
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching divisions:", error);
            }
        });
    });

    // Load subjects and fetch existing marks when both class and division are selected
    divisionSelect.on('change', function () {
        var examId = examSelect.val();
        var classAssigned = classSelect.val();
        var divisionAssigned = divisionSelect.val();

        if (examId && classAssigned && divisionAssigned) {
            $.ajax({
                url: '/management/get_subject/',
                data: {
                    exam_id: examId,
                    class_assigned: classAssigned,
                    division_assigned: divisionAssigned
                },
                type: 'GET',
                success: function (response) {
                    subjectSelect.empty().append('<option value="" disabled selected>Select Subject</option>');
                    $.each(response.subjects, function (index, subject) {
                        subjectSelect.append('<option value="' + subject.subject_id + '">' + subject.subject_name + '</option>');
                    });
                },
                error: function (xhr, status, error) {
                    console.error("Error fetching subjects:", error);
                }
            });
        } else {
            console.error("Please select both class and division before fetching subjects.");
        }
    });

    // Load existing marks when subject is selected
    subjectSelect.on('change', function () {
        var examId = examSelect.val();
        var classAssigned = classSelect.val();
        var divisionAssigned = divisionSelect.val();
        var subjectId = $(this).val();

        if (examId && classAssigned && divisionAssigned && subjectId) {
            $.ajax({
                url: '/management/get_existing_marks/',
                data: {
                    exam_id: examId,
                    class_assigned: classAssigned,
                    division_assigned: divisionAssigned,
                    subject_id: subjectId
                },
                type: 'GET',
                success: function (response) {
                    studentsTable.empty();
                    if (response.marks.length > 0) {
                        var tableHtml = '<table><thead><tr><th>Student</th><th>Marks Obtained</th><th>Total Marks</th></tr></thead><tbody>';
                        $.each(response.marks, function (index, mark) {
                            tableHtml += '<tr><td>' + mark.student_name + '</td><td><input type="number" name="marks_obtained_' + mark.student_id + '" value="' + mark.marks_obtained + '" /></td><td><input type="number" name="out_of_' + mark.student_id + '" value="' + mark.out_of + '" /></td></tr>';
                        });
                        tableHtml += '</tbody></table>';
                        studentsTable.html(tableHtml);
                    } else {
                        studentsTable.html('<p>No marks found.</p>');
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error fetching existing marks:", error);
                }
            });
        } else {
            console.error("Please select all fields before fetching marks.");
        }
    });

    // Set total marks for all students
    totalMarksInput.on('input', function () {
        var totalMarks = $(this).val();
        studentsTable.find('input[name^="out_of_"]').val(totalMarks);
    });

    // Handle form submission to add or update marks
    $('#addMarksForm').on('submit', function (e) {
        e.preventDefault();
    
        var formData = {
            academic_year: academicYearSelect.val(),
            exam: examSelect.val(),
            class_assigned: classSelect.val(),
            division_assigned: divisionSelect.val(),
            subject: subjectSelect.val(),
            marks_data: []
        };
    
        studentsTable.find('tbody tr').each(function () {
            // Try to find the marks obtained input field
            var marksInput = $(this).find('input[name^="marks_obtained_"]');
            if (marksInput.length > 0) {
                var studentId = marksInput.attr('name').split('_')[2];
                var marksObtained = marksInput.val();
                var outOf = $(this).find('input[name="out_of_' + studentId + '"]').val();
    
                if (marksObtained || outOf) {
                    formData.marks_data.push({
                        student_id: studentId,
                        marks_obtained: marksObtained,
                        out_of: outOf
                    });
                }
            } else {
                console.warn("Marks input field not found for a student row");
            }
        });
    
        console.log("Form Data:", formData);  // Debug log
    
        $.ajax({
            url: '/management/update_marks/',
            type: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': csrfToken
            },
            success: function (response) {
                alert('Marks updated successfully');
            },
            error: function (xhr, status, error) {
                alert('Error updating marks: ' + xhr.responseText);
                console.error("Error updating marks:", error);
            }
        });
    });
});
