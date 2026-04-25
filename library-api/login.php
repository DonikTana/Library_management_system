<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$password = getValue($data, ['password']);

if (!$enrollmentId || !$password) {
    sendError('Enrollment ID and password are required.');
}

$user = requireUserByEnrollmentId($mysqli, $enrollmentId, true);

if (!verifyPasswordAndUpgradeIfNeeded($mysqli, $user, $password)) {
    sendError('Invalid enrollment ID or password.');
}

unset($user['password']);
$user['role'] = normalizeUserRole((string) $user['role']);
sendSuccess(['user' => $user]);
