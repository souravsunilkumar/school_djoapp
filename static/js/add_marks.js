$(document).ready(function() {
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
        success: function(response) {
            academicYearSelect.empty().append('<option value="" disabled selected>Select Academic Year</option>');
            $.each(response.academic_years, function(index, year) {
                academicYearSelect.append('<option value="' + year + '">' + year + '</option>');
            });
        },
        error: function(xhr, status, error) {
            console.error("Error fetching academic years:", error);
        }
    });
    
    // Load exams based on selected academic year
    academicYearSelect.on('change', function() {
        var academicYear = $(this).val();
        $.ajax({
            url: '/management/get_exams/',
            data: { academic_year: academicYear },
            type: 'GET',
            success: function(response) {
                examSelect.empty().append('<option value="" disabled selected>Select Exam</option>');
                $.each(response.exams, function(index, exam) {
                    examSelect.append('<option value="' + exam.exam_id + '">' + exam.exam_name + '</option>');
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching exams:", error);
            }
        });
    });
    
    // Load classes based on selected exam
    examSelect.on('change', function() {
        var examId = $(this).val();
        $.ajax({
            url: '/management/get_classes_and_divisions/',
            type: 'GET',
            success: function(response) {
                classSelect.empty().append('<option value="" disabled selected>Select Class</option>');
                $.each(response.classes, function(index, cls) {
                    classSelect.append('<option value="' + cls.class_assigned + '">' + cls.class_assigned + '</option>');
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching classes:", error);
            }
        });
    });
    
    // Load divisions based on selected class
    classSelect.on('change', function() {
        var classAssigned = $(this).val();
        $.ajax({
            url: '/management/get_classes_and_divisions/',
            data: { class_id: classAssigned },
            type: 'GET',
            success: function(response) {
                divisionSelect.empty().append('<option value="" disabled selected>Select Division</option>');
                $.each(response.divisions, function(index, div) {
                    divisionSelect.append('<option value="' + div.division_assigned + '">' + div.division_assigned + '</option>');
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching divisions:", error);
            }
        });
    });
    
    // Load subjects based on selected exam
    examSelect.on('change', function() {
        var examId = $(this).val();
        $.ajax({
            url: '/management/get_subject/',
            data: { exam_id: examId },
            type: 'GET',
            success: function(response) {
                subjectSelect.empty().append('<option value="" disabled selected>Select Subject</option>');
                $.each(response.subjects, function(index, subject) {
                    subjectSelect.append('<option value="' + subject.subject_id + '">' + subject.subject_name + '</option>');
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching subjects:", error);
            }
        });
    });
    
    // Load students based on selected subject
    subjectSelect.on('change', function() {
        var examId = examSelect.val();
        var classAssigned = classSelect.val();
        var divisionAssigned = divisionSelect.val();
        $.ajax({
            url: '/management/get_students/',
            data: {
                exam_id: examId,
                class_assigned: classAssigned,
                division_assigned: divisionAssigned
            },
            type: 'GET',
            success: function(response) {
                studentsTable.empty();
                if (Array.isArray(response.students) && response.students.length > 0) {
                    var tableHtml = '<table><thead><tr><th>Student</th><th>Marks Obtained</th><th>Total Marks</th></tr></thead><tbody>';
                    $.each(response.students, function(index, student) {
                        tableHtml += '<tr><td>' + student.first_name + ' ' + student.last_name + '</td><td><input type="number" name="marks_obtained_' + student.id + '" /></td><td><input type="number" name="out_of_' + student.id + '" /></td></tr>';
                    });
                    tableHtml += '</tbody></table>';
                    studentsTable.html(tableHtml);
                } else {
                    studentsTable.html('<p>No students found.</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error("Error fetching students:", error);
            }
        });
    });
    
    // Set total marks for all students
    totalMarksInput.on('input', function() {
        var totalMarks = $(this).val();
        studentsTable.find('input[name^="out_of_"]').val(totalMarks);
    });
    
    // Handle form submission to add marks
    $('#addMarksForm').on('submit', function(e) {
        e.preventDefault();
        
        var academicYear = academicYearSelect.val();
        var examId = examSelect.val();
        var classAssigned = classSelect.val();
        var divisionAssigned = divisionSelect.val();
        var subjectId = subjectSelect.val();
        
        var marksData = {};
        studentsTable.find('tbody tr').each(function() {
            var studentId = $(this).find('input[name^="marks_obtained_"]').attr('name').split('_')[2];
            var marksObtained = $(this).find('input[name="marks_obtained_' + studentId + '"]').val();
            var outOf = $(this).find('input[name="out_of_' + studentId + '"]').val();
            
            if (marksObtained || outOf) {
                marksData[studentId] = { marks_obtained: marksObtained, out_of: outOf };
            }
        });
        
        $.ajax({
            url: '/management/add_marks/',
            type: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            contentType: 'application/json',
            data: JSON.stringify({
                academic_year: academicYear,
                exam: examId,
                class_assigned: classAssigned,
                division_assigned: divisionAssigned,
                subject: subjectId,
                marks: marksData
            }),
            success: function(response) {
                if (response.success) {
                    alert('Marks added successfully!');
                } else {
                    alert('Error adding marks: ' + (response.error || 'Unknown error.'));
                }
            },
            error: function(xhr, status, error) {
                alert('An error occurred while adding the marks: ' + error);
            }
        });
    });
});
