$(document).ready(function () {
    // Utility function to get CSRF token
    function getCSRFToken() {
        const tokenElement = $('[name=csrfmiddlewaretoken]');
        return tokenElement.length ? tokenElement.val() : '';
    }

    // Fetch Academic Years
    function fetchAcademicYears() {
        $.ajax({
            url: '/parent/get_academic_years/',
            method: 'GET',
            success: function (data) {
                $('#academicYearSelect').empty();
                $.each(data.academic_years, function (index, year) {
                    $('#academicYearSelect').append(`<option value="${year}">${year}</option>`);
                });
            },
            error: function (error) {
                console.error('Error fetching academic years:', error);
            }
        });
    }

    // Fetch Students
    function fetchStudents() {
        $.ajax({
            url: '/parent/get_students_for_parent/', // Ensure this URL matches the configured URL pattern
            method: 'GET',
            success: function (data) {
                $('#studentSelect').empty();
                $.each(data.students, function (index, student) {
                    $('#studentSelect').append(`<option value="${student.id}">${student.first_name} ${student.last_name} - ${student.class_assigned} ${student.division_assigned}</option>`);
                });
            },
            error: function (error) {
                console.error('Error fetching students:', error);
            }
        });
    }

    // Load Marks
    function loadMarks() {
        const academicYear = $('#academicYearSelect').val();
        const studentId = $('#studentSelect').val();

        $.ajax({
            url: '/parent/get_student_marks/', // Ensure this URL matches the configured URL pattern
            method: 'GET',
            data: {
                academic_year: academicYear,
                student_id: studentId
            },
            success: function (data) {
                $('#marksContainer').empty();
                if (data.marks.length) {
                    // Group marks by exam
                    const marksByExam = {};
                    $.each(data.marks, function (index, mark) {
                        if (!marksByExam[mark.exam]) {
                            marksByExam[mark.exam] = [];
                        }
                        marksByExam[mark.exam].push(mark);
                    });

                    // Build the HTML for displaying marks
                    $.each(marksByExam, function (exam, marks) {
                        const examSection = $('<div>').addClass('examSection');
                        examSection.append(`<h2>Marks for ${exam}</h2>`);
                        const table = $('<table>').addClass('marksTable');
                        table.append('<thead><tr><th>Student Name</th><th>Subject</th><th>Marks Obtained</th><th>Total Marks</th></tr></thead>');
                        const tbody = $('<tbody>');

                        $.each(marks, function (index, mark) {
                            tbody.append(`<tr><td>${mark.student_name}</td><td>${mark.subject}</td><td>${mark.marks_obtained}</td><td>${mark.total_marks}</td></tr>`);
                        });

                        table.append(tbody);
                        examSection.append(table);
                        $('#marksContainer').append(examSection);
                    });
                } else {
                    $('#marksContainer').html('<p>No marks available for the selected student and academic year.</p>');
                }
            },
            error: function (error) {
                console.error('Error loading marks:', error);
            }
        });
    }

    // Show Progress (Generate Graphs)
    function showProgress() {
        const academicYear = $('#academicYearSelect').val();
        const studentId = $('#studentSelect').val();

        $.ajax({
            url: '/parent/get_student_progress/',
            method: 'GET',
            data: {
                academic_year: academicYear,
                student_id: studentId
            },
            success: function (data) {
                console.log('Received data:', data); // Log data to inspect
                $('#progressChartsContainer').empty(); // Clear previous charts

                if (data.progress && Object.keys(data.progress).length) {
                    const subjects = Object.keys(data.progress);

                    // Create a chart for each subject
                    $.each(subjects, function (index, subject) {
                        const subjectData = data.progress[subject];

                        // Create a canvas for each chart
                        const chartTile = $('<div>').addClass('chartTile');
                        const chartCanvas = $('<canvas>').attr('id', `chart_${subject}`).attr('width', 400).attr('height', 200);
                        chartTile.append(`<h3>Progress of ${subject}</h3>`);
                        chartTile.append(chartCanvas);
                        $('#progressChartsContainer').append(chartTile);

                        // Get exam names and marks for the subject
                        const examNames = subjectData.map(item => item.exam_name); // Adjusted field name
                        const marksObtained = subjectData.map(item => item.marks_obtained);

                        // Generate a random color
                        const getRandomColor = () => {
                            const letters = '0123456789ABCDEF';
                            let color = '#';
                            for (let i = 0; i < 6; i++) {
                                color += letters[Math.floor(Math.random() * 16)];
                            }
                            return color;
                        };

                        // Create chart
                        const ctx = document.getElementById(`chart_${subject}`).getContext('2d');
                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: examNames,
                                datasets: [{
                                    label: `Marks for ${subject}`,
                                    data: marksObtained,
                                    borderColor: getRandomColor(), // Random color for each line
                                    backgroundColor: 'transparent', // No fill
                                    borderWidth: 2,
                                    tension: 0.1
                                }]
                            },
                            options: {
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }
                        });
                    });
                } else {
                    $('#progressChartsContainer').html('<p>No progress data available for the selected student and academic year.</p>');
                }
            },
            error: function (error) {
                console.error('Error loading progress:', error);
            }
        });
    }

    // Initialize the page
    fetchAcademicYears();
    fetchStudents();

    // Event listeners
    $('#loadMarksButton').click(function () {
        loadMarks();
    });
    $('#showProgressButton').click(function () {
        showProgress(); // Fetch and display progress when the button is clicked
    });
});
