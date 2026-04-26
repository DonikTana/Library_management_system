<?php
require_once 'db.php';

// Get all admin users
$query = "SELECT enrollment_id, name, email, role FROM users WHERE role='admin' OR role='Admin' LIMIT 5";
$result = $mysqli->query($query);

if (!$result) {
    echo json_encode(['error' => $mysqli->error]);
    exit;
}

$admins = [];
while ($row = $result->fetch_assoc()) {
    $admins[] = $row;
}

echo json_encode(['admins' => $admins], JSON_PRETTY_PRINT);
?>
