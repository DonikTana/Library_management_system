<?php
// Load environment variables from .env file
if (file_exists(__DIR__ . '/.env')) {
    $envVars = parse_ini_file(__DIR__ . '/.env');
    foreach ($envVars as $key => $value) {
        putenv($key . '=' . $value);
    }
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$host = 'localhost';
$user = 'root';
$password = '';
$dbName = 'library_db';

$mysqli = new mysqli($host, $user, $password, $dbName);
if ($mysqli->connect_errno) {
    echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

function getRequestData()
{
    $payload = file_get_contents('php://input');
    if (empty($payload)) {
        return [];
    }

    $data = json_decode($payload, true);
    if (!is_array($data)) {
        sendError('Invalid JSON input.');
    }

    return $data;
}

function getValue(array $data, array $keys, $default = null)
{
    foreach ($keys as $key) {
        if (isset($data[$key]) && $data[$key] !== '') {
            return trim($data[$key]);
        }
    }
    return $default;
}

function sendSuccess(array $payload = [])
{
    echo json_encode(array_merge(['success' => true], $payload));
    exit;
}

function sendError(string $message, int $code = 400)
{
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

function sanitizeString($value)
{
    return trim(filter_var($value, FILTER_SANITIZE_STRING));
}

function normalizeUserRole(string $role): string
{
    $role = strtolower(trim($role));
    return $role === 'student' ? 'user' : $role;
}

function getUserByEnrollmentId(mysqli $mysqli, string $enrollmentId, bool $includePassword = false): ?array
{
    $fields = $includePassword
        ? 'enrollment_id, name, email, role, password'
        : 'enrollment_id, name, email, role';
    $query = "SELECT {$fields} FROM users WHERE enrollment_id = ? LIMIT 1";
    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        sendError('Failed to prepare user lookup.');
    }

    $stmt->bind_param('s', $enrollmentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc() ?: null;
    $stmt->close();

    return $user;
}

function requireUserByEnrollmentId(mysqli $mysqli, ?string $enrollmentId, bool $includePassword = false): array
{
    if (!$enrollmentId) {
        sendError('Enrollment ID is required.');
    }

    $user = getUserByEnrollmentId($mysqli, $enrollmentId, $includePassword);
    if (!$user) {
        sendError('User not found.', 404);
    }

    return $user;
}

function verifyPasswordAndUpgradeIfNeeded(mysqli $mysqli, array $user, string $plainPassword): bool
{
    $storedPassword = (string) ($user['password'] ?? '');
    if ($storedPassword === '') {
        return false;
    }

    if (password_verify($plainPassword, $storedPassword)) {
        if (password_needs_rehash($storedPassword, PASSWORD_DEFAULT)) {
            $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
            $stmt = $mysqli->prepare('UPDATE users SET password = ? WHERE enrollment_id = ?');
            if ($stmt) {
                $stmt->bind_param('ss', $newHash, $user['enrollment_id']);
                $stmt->execute();
                $stmt->close();
            }
        }
        return true;
    }

    // Support legacy plain-text passwords and migrate them on successful login.
    if (hash_equals($storedPassword, $plainPassword)) {
        $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
        $stmt = $mysqli->prepare('UPDATE users SET password = ? WHERE enrollment_id = ?');
        if ($stmt) {
            $stmt->bind_param('ss', $newHash, $user['enrollment_id']);
            $stmt->execute();
            $stmt->close();
        }
        return true;
    }

    return false;
}

function ensureSeatCount(mysqli $mysqli, int $targetCount = 30)
{
    $countResult = $mysqli->query('SELECT COUNT(*) AS total FROM study_hall_seats');
    if (!$countResult) {
        sendError('Failed to verify seat availability.');
    }

    $countRow = $countResult->fetch_assoc();
    $countResult->close();
    $currentCount = (int) ($countRow['total'] ?? 0);

    if ($currentCount >= $targetCount) {
        return;
    }

    $insertSeat = $mysqli->prepare('INSERT INTO study_hall_seats (status, enrollment_id, reserved_at) VALUES ("available", NULL, NULL)');
    if (!$insertSeat) {
        sendError('Failed to prepare seat setup.');
    }

    for ($index = $currentCount; $index < $targetCount; $index++) {
        if (!$insertSeat->execute()) {
            $insertSeat->close();
            sendError('Failed to set up study hall seats.');
        }
    }

    $insertSeat->close();
}
