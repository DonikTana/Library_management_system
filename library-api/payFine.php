<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$borrowId = getValue($data, ['borrow_id', 'borrowId']);

if (!$enrollmentId || !$borrowId) {
    sendError('Enrollment ID and borrow ID are required.');
}

$user = requireUserByEnrollmentId($mysqli, $enrollmentId);

// Get borrow record
$borrowQuery = 'SELECT enrollment_id, fine FROM borrow WHERE id = ? AND status = "RETURNED" AND fine > 0 AND payment_status = "UNPAID" LIMIT 1';
$stmt = $mysqli->prepare($borrowQuery);
$stmt->bind_param('i', $borrowId);
$stmt->execute();
$result = $stmt->get_result();
$borrow = $result->fetch_assoc();
$stmt->close();

if (!$borrow) {
    sendError('No unpaid fine found for this return.');
}

// Only the borrower or admin can pay the fine
$userRole = normalizeUserRole((string) $user['role']);
if ($user['enrollment_id'] !== $borrow['enrollment_id'] && $userRole !== 'admin') {
    sendError('You are not authorized to pay this fine.', 403);
}

// Mark fine as paid
$updateBorrow = 'UPDATE borrow SET payment_status = "PAID" WHERE id = ?';
$stmt = $mysqli->prepare($updateBorrow);
$stmt->bind_param('i', $borrowId);
$updated = $stmt->execute();
$stmt->close();

if ($updated) {
    sendSuccess([
        'message' => 'Fine paid successfully.',
        'amount' => $borrow['fine']
    ]);
}

sendError('Failed to process fine payment.');
?>
