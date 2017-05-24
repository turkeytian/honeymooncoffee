<?php
    $email=$_POST['email'];
    $subject = 'Reservation Confirmation';
    $message = 'Thank you for making a reservation.';

    mail($email, $subject, $message);
?>
