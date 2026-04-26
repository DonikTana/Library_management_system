<?php
require_once 'db.php';

$data = getRequestData();
$actorEnrollmentId = getValue($data, ['actor_enrollment_id', 'actorEnrollmentId', 'enrollment_id', 'enrollmentId']);
$borrowerEnrollmentId = getValue($data, ['borrower_enrollment_id', 'borrowerEnrollmentId'], $actorEnrollmentId);
$bookId = getValue($data, ['book_id', 'bookId']);

if (!$actorEnrollmentId || !$borrowerEnrollmentId || !$bookId) {
    sendError('Enrollment ID and book ID are required.');
}

$actor = requireUserByEnrollmentId($mysqli, $actorEnrollmentId);
$actorRole = normalizeUserRole((string) $actor['role']);

if ($actor['enrollment_id'] !== $borrowerEnrollmentId && $actorRole !== 'admin') {
    sendError('You are not authorized to return this book.', 403);
}

$borrowQuery = 'SELECT id FROM borrow WHERE enrollment_id = ? AND book_id = ? AND status = "borrowed" LIMIT 1';
$stmt = $mysqli->prepare($borrowQuery);
$stmt->bind_param('si', $borrowerEnrollmentId, $bookId);
$stmt->execute();
$result = $stmt->get_result();
$borrow = $result->fetch_assoc();
$stmt->close();

if (!$borrow) {
    sendError('No active borrowed record found for this book.');
}

$mysqli->begin_transaction();
$updateBorrow = 'UPDATE borrow SET status = "returned", return_date = NOW() WHERE id = ?';
$stmt = $mysqli->prepare($updateBorrow);
$stmt->bind_param('i', $borrow['id']);
$updatedBorrow = $stmt->execute();
$stmt->close();

$updateBook = 'UPDATE books SET available = 1, available_quantity = LEAST(total_quantity, available_quantity + 1) WHERE book_id = ?';
$stmt = $mysqli->prepare($updateBook);
$stmt->bind_param('i', $bookId);
$updatedBook = $stmt->execute();
$stmt->close();

if ($updatedBorrow && $updatedBook) {
    $mysqli->commit();
    sendSuccess();
}

$mysqli->rollback();
sendError('Return request failed.');
