<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$borrowId = getValue($data, ['borrow_id', 'borrowId']);

if (!$enrollmentId || !$borrowId) {
    sendError('Enrollment ID and borrow ID are required.');
}

$admin = requireUserByEnrollmentId($mysqli, $enrollmentId);
if (normalizeUserRole((string) $admin['role']) !== 'admin') {
    sendError('Only admins can reject returns.', 403);
}

// Get borrow record
$borrowQuery = 'SELECT id FROM borrow WHERE id = ? AND status = "PENDING" LIMIT 1';
$stmt = $mysqli->prepare($borrowQuery);
$stmt->bind_param('i', $borrowId);
$stmt->execute();
$result = $stmt->get_result();
$borrow = $result->fetch_assoc();
$stmt->close();

if (!$borrow) {
    sendError('Pending borrow record not found.');
}

// Restore the loan to BORROWED so the student can request return again later.
$updateBorrow = 'UPDATE borrow SET status = "BORROWED", return_requested_at = NULL WHERE id = ?';
$stmt = $mysqli->prepare($updateBorrow);
$stmt->bind_param('i', $borrowId);
$updated = $stmt->execute();
$stmt->close();

if ($updated) {
    sendSuccess(['message' => 'Return request rejected. The book remains borrowed and can be requested again.']);
}

sendError('Failed to reject return.');
?>
