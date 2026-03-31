<?php
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
