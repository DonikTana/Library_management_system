<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$password = getValue($data, ['password']);

if (!$enrollmentId || !$password) {
    sendError('Enrollment ID and password are required.');
}

$query = 'SELECT enrollment_id, name, email, role, password FROM users WHERE enrollment_id = ? LIMIT 1';
$stmt = $mysqli->prepare($query);
$stmt->bind_param('s', $enrollmentId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || $user['password'] !== $password) {
    sendError('Invalid enrollment ID or password.');
}

unset($user['password']);
$user['role'] = strtolower(trim((string) $user['role']));
if ($user['role'] === 'student') {
    $user['role'] = 'user';
}
sendSuccess(['user' => $user]);
