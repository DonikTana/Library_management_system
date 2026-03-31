<?php
require_once 'db.php';

ensureSeatCount($mysqli, 30);

$query = 'SELECT seat_id, status, enrollment_id, reserved_at FROM study_hall_seats ORDER BY seat_id';
$result = $mysqli->query($query);

if (!$result) {
    sendError('Failed to fetch seats.');
}

$seats = [];
while ($row = $result->fetch_assoc()) {
    $seats[] = $row;
}

sendSuccess(['seats' => $seats]);
