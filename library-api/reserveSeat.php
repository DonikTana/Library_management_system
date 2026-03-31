<?php
require_once 'db.php';

ensureSeatCount($mysqli, 30);

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$seatId = getValue($data, ['seat_id', 'seatId']);

if (!$enrollmentId || !$seatId) {
    sendError('Enrollment ID and seat ID are required.');
}

$checkUser = 'SELECT enrollment_id FROM users WHERE enrollment_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkUser);
$stmt->bind_param('s', $enrollmentId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();
if (!$user) {
    sendError('User not found.');
}

$checkSeat = 'SELECT status FROM study_hall_seats WHERE seat_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkSeat);
$stmt->bind_param('i', $seatId);
$stmt->execute();
$result = $stmt->get_result();
$seat = $result->fetch_assoc();
$stmt->close();

if (!$seat) {
    sendError('Seat not found.');
}
if ($seat['status'] !== 'available') {
    sendError('This seat is already reserved.');
}

$checkUserSeat = 'SELECT seat_id FROM study_hall_seats WHERE enrollment_id = ? AND status = "reserved" LIMIT 1';
$stmt = $mysqli->prepare($checkUserSeat);
$stmt->bind_param('s', $enrollmentId);
$stmt->execute();
$result = $stmt->get_result();
$existing = $result->fetch_assoc();
$stmt->close();

if ($existing) {
    sendError('You already have a reserved seat.');
}

$updateSeat = 'UPDATE study_hall_seats SET status = "reserved", enrollment_id = ?, reserved_at = NOW() WHERE seat_id = ?';
$stmt = $mysqli->prepare($updateSeat);
$stmt->bind_param('si', $enrollmentId, $seatId);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Seat reservation failed.');
}

sendSuccess();
