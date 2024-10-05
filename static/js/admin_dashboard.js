$(document).ready(function() {
    console.log('Admin Dashboard loaded successfully.');

    // Fetch Admin Details and update the dashboard
    $.ajax({
        url: '/setup_auth/api/admin_dashboard/',
        type: 'GET',
        success: function(response) {
            console.log('Admin details fetched:', response);
            $('#admin-name').text(response.data.admin_name);
            $('#admin-name-dash').text(response.data.admin_name);
            $('#school-name').text(response.data.school_name);
        },
        error: function(error) {
            console.error('Error fetching admin details:', error);
        }
    });

    // Show Sub Admin Registration Modal
    $('#show-sub-admin-register-form').click(function() {
        openModal('#sub-admin-modal');
        $('#sub_admin_username').focus();
    });

    // Show Employee Registration Modal
    $('#show-employee-register-form').click(function() {
        openModal('#employee-modal');
        $('#emp_username').focus();
    });

    // Function to open modal and backdrop
    function openModal(modalId) {
        $(modalId).removeClass('hidden').attr('aria-hidden', 'false');
        $('#modal-background').removeClass('hidden');
    }

    // Close modals when clicking the background or close button
    $(document).on('click', '.modal-close, #modal-background', function() {
        closeModals();
    });

    // Function to close modals and backdrop
    function closeModals() {
        $('.modal').addClass('hidden').attr('aria-hidden', 'true');
        $('#modal-background').addClass('hidden');
    }

    // Handle Sub Admin Registration Form submission via AJAX
    $('#sub-admin-register-form').on('submit', function(event) {
        event.preventDefault();
        let password = $('#password').val();
        let confirmPassword = $('#confirm_password').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        let formData = {
            sub_admin_username: $('#sub_admin_username').val(),
            sub_admin_first_name: $('#sub_admin_first_name').val(),
            sub_admin_last_name: $('#sub_admin_last_name').val(),
            password: password
        };

        $.ajax({
            url: '/setup_auth/api/register_sub_admin/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    alert('Sub Admin registered successfully!');
                    closeModals();
                    $('#sub-admin-register-form')[0].reset();
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(error) {
                alert('Error submitting form. Try again later.');
                console.error('Sub Admin registration error:', error);
            }
        });
    });

    // Handle Employee Registration Form submission
    $('#employee-registration-form').on('submit', function(event) {
        event.preventDefault();
        let password = $('#emp_password').val();
        let confirmPassword = $('#emp_confirm_password').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        let formData = {
            emp_username: $('#emp_username').val(),
            emp_first_name: $('#emp_first_name').val(),
            emp_last_name: $('#emp_last_name').val(),
            emp_contact: $('#emp_contact').val(),
            emp_designation: $('#emp_designation').val(),
            password: password
        };

        $.ajax({
            url: '/setup_auth/api/register_employee/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    alert('Employee registered successfully!');
                    closeModals();
                    $('#employee-registration-form')[0].reset();
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(error) {
                alert('Error submitting form. Try again later.');
                console.error('Employee registration error:', error);
            }
        });
    });

    // Logout functionality
    $('#logout_button').on('click', function() {
        $.ajax({
            url: '/setup_auth/api/logout/',
            type: 'POST',
            success: function(response) {
                if (response.success) {
                    window.location.href = '/setup_auth/login/';
                }
            },
            error: function(error) {
                console.error('Logout error:', error);
            }
        });
    });
});
