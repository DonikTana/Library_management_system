<?php
require_once 'db.php';

ensureSeatCount($mysqli, 30);

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$seatId = getValue($data, ['seat_id', 'seatId']);
$role = getValue($data, ['role']);

if (!$seatId || !$enrollmentId) {
    sendError('Enrollment ID and seat ID are required.');
}

$checkSeat = 'SELECT status, enrollment_id FROM study_hall_seats WHERE seat_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkSeat);
$stmt->bind_param('i', $seatId);
$stmt->execute();
$result = $stmt->get_result();
$seat = $result->fetch_assoc();
$stmt->close();

if (!$seat) {
    sendError('Seat not found.');
}
if ($seat['status'] !== 'reserved') {
    sendError('This seat is not reserved.');
}
if ($seat['enrollment_id'] !== $enrollmentId && $role !== 'admin') {
    sendError('You can only release your own reserved seat.');
}

$updateSeat = 'UPDATE study_hall_seats SET status = "available", enrollment_id = NULL, reserved_at = NULL WHERE seat_id = ?';
$stmt = $mysqli->prepare($updateSeat);
$stmt->bind_param('i', $seatId);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Failed to release seat.');
}

sendSuccess();
