<?php
header('Content-Type: application/json');
$payload = file_get_contents('php://input');
$decoded = json_decode($payload, true);
$response = [
    'raw' => $payload,
    'decoded' => $decoded,
    'json_error' => json_last_error_msg(),
    'is_array' => is_array($decoded),
];
echo json_encode($response);
