$(document).ready(function () {
    // Load academic years
    $.ajax({
        url: '/admin_management/api/get-academic-years/',
        method: 'GET',
        success: function (data) {
            data.academic_years.forEach(function (year) {
                $('#academicYearSelect').append(new Option(year, year));
            });
        },
        error: function (err) {
            console.error("Error fetching academic years:", err);
        }
    });

    // Load classes when an academic year is selected
    $('#academicYearSelect').change(function () {
        const academicYear = $(this).val();
        $.ajax({
            url: '/admin_management/api/get-classes-divisions/',
            method: 'GET',
            data: { academic_year: academicYear },
            success: function (data) {
                $('#classSelect').empty().append(new Option('Select Class', '', true, true));
                data.classes.forEach(function (cls) {
                    $('#classSelect').append(new Option(cls.class_assigned, cls.class_assigned));
                });
            },
            error: function (err) {
                console.error("Error fetching classes:", err);
            }
        });
    });

    // Load divisions when a class is selected
    $('#classSelect').change(function () {
        const classAssigned = $(this).val();
        $.ajax({
            url: '/admin_management/api/get-divisions/',
            method: 'GET',
            data: { class_assigned: classAssigned },
            success: function (data) {
                $('#divisionSelect').empty().append(new Option('Select Division', '', true, true));
                data.divisions.forEach(function (div) {
                    $('#divisionSelect').append(new Option(div.division_assigned, div.division_assigned));
                });
            },
            error: function (err) {
                console.error("Error fetching divisions:", err);
            }
        });
    });

    // Get marks when the form is submitted
    $('#marksForm').submit(function (event) {
        event.preventDefault();
        const academicYear = $('#academicYearSelect').val();
        const classAssigned = $('#classSelect').val();
        const divisionAssigned = $('#divisionSelect').val();

        $.ajax({
            url: '/admin_management/api/get-student-marks/',
            method: 'GET',
            data: {
                academic_year: academicYear,
                class_assigned: classAssigned,
                division_assigned: divisionAssigned
            },
            success: function (data) {
                $('#examMarks').empty();
                $('#assignmentMarks').empty();

                let examMarksGrouped = {};
                let assignmentMarksGrouped = {};

                // Group marks by exam and assignment
                data.marks.forEach(function (mark) {
                    if (mark.type === 'exam') {
                        if (!examMarksGrouped[mark.exam_name]) {
                            examMarksGrouped[mark.exam_name] = {};
                        }
                        if (!examMarksGrouped[mark.exam_name][mark.subject_name]) {
                            examMarksGrouped[mark.exam_name][mark.subject_name] = [];
                        }
                        examMarksGrouped[mark.exam_name][mark.subject_name].push(mark);
                    } else {
                        const subjectName = mark.subject_name;
                        const admissionNumber = mark.admission_number;
                        const rollNumber = mark.roll_number;

                        if (!assignmentMarksGrouped[subjectName]) {
                            assignmentMarksGrouped[subjectName] = {};
                        }
                        if (!assignmentMarksGrouped[subjectName][admissionNumber]) {
                            assignmentMarksGrouped[subjectName][admissionNumber] = {
                                roll_number: rollNumber,
                                student_name: mark.student_name,
                                assignments: {}
                            };
                        }

                        // Add assignment details correctly
                        for (const key in mark) {
                            if (key !== 'subject_name' && key !== 'admission_number' && key !== 'roll_number' && key !== 'student_name') {
                                assignmentMarksGrouped[subjectName][admissionNumber].assignments[key] = mark[key];
                            }
                        }
                    }
                });

                // Render exam marks
                for (const examName in examMarksGrouped) {
                    const subjects = examMarksGrouped[examName];
                    let examTable = `<h3>${examName}:</h3>`;
                    examTable += `
                        <table>
                            <thead>
                                <tr>
                                    <th>Admission Number</th>
                                    <th>Roll Number</th>
                                    <th>Student Name</th>`;
                    // Add subject headers
                    for (const subject in subjects) {
                        examTable += `<th>${subject}</th>`;
                    }
                    examTable += `</tr></thead><tbody>`;

                    // Gather student data
                    Object.keys(subjects).forEach((subject) => {
                        subjects[subject].forEach((studentMark) => {
                            if (!examTable.includes(studentMark.admission_number)) {
                                examTable += `
                                    <tr>
                                        <td>${studentMark.admission_number}</td>
                                        <td>${studentMark.roll_number}</td>
                                        <td>${studentMark.student_name}</td>`;

                                // Fill in subject marks
                                for (const subjectName in subjects) {
                                    const markData = subjects[subjectName].find(m => m.admission_number === studentMark.admission_number);
                                    const marks = markData ? `${markData.marks_obtained}/${markData.total_marks}` : '';
                                    examTable += `<td>${marks}</td>`;
                                }
                                examTable += `</tr>`;
                            }
                        });
                    });

                    examTable += `</tbody></table>`;
                    $('#examMarks').append(examTable);
                }

                // Render assignment marks
                for (const subjectName in assignmentMarksGrouped) {
                    const students = assignmentMarksGrouped[subjectName];
                    let assignmentTable = `<h3>Assignments for ${subjectName}:</h3>`;
                    assignmentTable += `
                        <table>
                            <thead>
                                <tr>
                                    <th>Admission Number</th>
                                    <th>Roll Number</th>
                                    <th>Student Name</th>
                                    <th>Marks</th>
                                </tr>
                            </thead>
                            <tbody>`;

                    // Fill in assignment marks for each student
                    Object.keys(students).forEach((admissionNumber) => {
                        const student = students[admissionNumber];
                        assignmentTable += `
                            <tr>
                                <td>${admissionNumber}</td>
                                <td>${student.roll_number}</td>
                                <td>${student.student_name}</td>`;

                        // Loop through assignments and display their marks
                        const assignmentMarks = Object.entries(student.assignments).map(([assignmentTitle, marks]) => `${assignmentTitle}: ${marks}`).join(', ');
                        assignmentTable += `<td>${assignmentMarks}</td>`;

                        assignmentTable += `</tr>`;
                    });

                    assignmentTable += `</tbody></table>`;
                    $('#assignmentMarks').append(assignmentTable);
                }

                // Show the containers if they have data
                $('#examMarksContainer').toggle($('#examMarks').children().length > 0);
                $('#assignmentMarksContainer').toggle($('#assignmentMarks').children().length > 0);
            },
            error: function (err) {
                console.error("Error fetching marks:", err);
            }
        });
    });
});
