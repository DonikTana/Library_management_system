<?php
require_once 'db.php';

ensureSeatCount($mysqli, 30);

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);

if (!$enrollmentId) {
    sendError('Enrollment ID is required.');
}

$checkUser = 'SELECT role FROM users WHERE enrollment_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkUser);
$stmt->bind_param('s', $enrollmentId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || $user['role'] !== 'admin') {
    sendError('Only admin users can reset seats.', 403);
}

$resetSeats = 'UPDATE study_hall_seats SET status = "available", enrollment_id = NULL, reserved_at = NULL';
$executed = $mysqli->query($resetSeats);

if (!$executed) {
    sendError('Failed to reset seats.');
}

sendSuccess();
