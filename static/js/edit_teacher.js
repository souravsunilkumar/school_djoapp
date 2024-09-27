document.getElementById('edit-teacher-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    var formData = new FormData(this);

    fetch('/admin_management/edit_teacher/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.conflict) {
            var class_assigned = formData.get('class_assigned'); 
            var division_assigned = formData.get('division_assigned'); 
            var first_name = formData.get('first_name');
            var last_name = formData.get('last_name');

            // Display conflict message in the modal
            document.getElementById('modal-message').innerText = `${data.existing_teacher} is already the class teacher of ${class_assigned}-${division_assigned}. Do you want to set ${first_name} ${last_name} as the new class teacher?`;
            document.getElementById('confirmation-modal').style.display = 'block';

            document.getElementById('confirm-button').onclick = function() {
                // Confirm the change
                formData.append('override', 'true'); // Flag to override existing class teacher
                fetch('/admin_management/edit_teacher/', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/admin_management/manage_teachers_page/'; // Redirect after success
                    } else {
                        // Handle case where update failed
                        console.error('Error updating teacher:', data);
                        alert('Failed to update the teacher. Please try again.');
                    }
                })
                .catch(error => console.error('Error on confirmation:', error));
                
                // Hide the confirmation modal after setting the click listener
                document.getElementById('confirmation-modal').style.display = 'none';
            };

            document.getElementById('cancel-button').onclick = function() {
                document.getElementById('confirmation-modal').style.display = 'none';
            };
        } else if (data.success) {
            window.location.href = '/admin_management/manage_teachers_page/'; // Redirect after success
        } else {
            // Handle case where no conflict but update failed
            console.error('Error updating teacher:', data);
            alert('Failed to update the teacher. Please try again.');
        }
    })
    .catch(error => console.error('Error:', error));
});
