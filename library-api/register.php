<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$name = getValue($data, ['name', 'fullName']);
$email = getValue($data, ['email']);
$password = getValue($data, ['password']);
$role = getValue($data, ['role']);

if (!$enrollmentId || !$name || !$email || !$password || !$role) {
    sendError('Enrollment ID, name, email, password, and role are required.');
}

$enrollmentId = sanitizeString($enrollmentId);
$name = sanitizeString($name);
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$password = trim($password);
$role = trim(strtolower($role));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email address.');
}

if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters long.');
}

if (!in_array($role, ['user', 'admin'], true)) {
    sendError('Role must be either user or admin.');
}

$role = $role === 'user' ? 'student' : 'admin';
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$checkQuery = 'SELECT enrollment_id FROM users WHERE enrollment_id = ? OR email = ? LIMIT 1';
$stmt = $mysqli->prepare($checkQuery);
$stmt->bind_param('ss', $enrollmentId, $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    $stmt->close();
    sendError('Enrollment ID or email already exists.');
}
$stmt->close();

$insertQuery = 'INSERT INTO users (enrollment_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)';
$stmt = $mysqli->prepare($insertQuery);
$stmt->bind_param('sssss', $enrollmentId, $name, $email, $passwordHash, $role);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Registration failed.');
}

sendSuccess();
