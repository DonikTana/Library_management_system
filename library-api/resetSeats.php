<?php
require_once 'db.php';

ensureSeatCount($mysqli, 30);

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);

if (!$enrollmentId) {
    sendError('Enrollment ID is required.');
}

$user = requireUserByEnrollmentId($mysqli, $enrollmentId);

if (normalizeUserRole((string) $user['role']) !== 'admin') {
    sendError('Only admin users can reset seats.', 403);
}

$resetSeats = 'UPDATE study_hall_seats SET status = "available", enrollment_id = NULL, reserved_at = NULL';
$executed = $mysqli->query($resetSeats);

if (!$executed) {
    sendError('Failed to reset seats.');
}

sendSuccess();
