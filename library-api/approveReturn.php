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
    sendError('Only admins can approve returns.', 403);
}

// Get the pending return request.
$borrowQuery = 'SELECT b.id, b.book_id, b.due_date, b.enrollment_id FROM borrow b WHERE b.id = ? AND b.status = "PENDING" LIMIT 1';
$stmt = $mysqli->prepare($borrowQuery);
if (!$stmt) {
    sendError('Failed to prepare return approval lookup.');
}
$stmt->bind_param('i', $borrowId);
$stmt->execute();
$result = $stmt->get_result();
$borrow = $result->fetch_assoc();
$stmt->close();

if (!$borrow) {
    sendError('Pending borrow record not found.');
}

// Calculate fine (₹3 per day overdue)
$today = date('Y-m-d');
$dueDate = $borrow['due_date'] ?: $today;
$fine = 0;
$paymentStatus = 'PAID';

if ($today > $dueDate) {
    $dueDateObj = new DateTime($dueDate);
    $todayObj = new DateTime($today);
    $daysDifference = $todayObj->diff($dueDateObj)->days;
    $fine = $daysDifference * 3;
    $paymentStatus = 'UNPAID';
}

// Update borrow record
$mysqli->begin_transaction();
$updateBorrow = 'UPDATE borrow SET status = "RETURNED", returned_at = NOW(), fine = ?, payment_status = ? WHERE id = ?';
$stmt = $mysqli->prepare($updateBorrow);
if (!$stmt) {
    $mysqli->rollback();
    sendError('Failed to prepare return approval update.');
}
$stmt->bind_param('isi', $fine, $paymentStatus, $borrowId);
$updatedBorrow = $stmt->execute();
$stmt->close();

// Increase book quantity
$updateBook = 'UPDATE books SET available = 1, available_quantity = LEAST(total_quantity, available_quantity + 1) WHERE book_id = ?';
$stmt = $mysqli->prepare($updateBook);
if (!$stmt) {
    $mysqli->rollback();
    sendError('Failed to prepare book quantity update.');
}
$stmt->bind_param('i', $borrow['book_id']);
$updatedBook = $stmt->execute();
$stmt->close();

if ($updatedBorrow && $updatedBook) {
    $mysqli->commit();
    sendSuccess([
        'message' => 'Return approved successfully.',
        'fine' => $fine,
        'payment_status' => $paymentStatus
    ]);
}

$mysqli->rollback();
sendError('Failed to approve return.');
?>
