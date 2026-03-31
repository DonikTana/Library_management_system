<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$bookId = getValue($data, ['book_id', 'bookId']);

if (!$enrollmentId || !$bookId) {
    sendError('Enrollment ID and book ID are required.');
}

$borrowQuery = 'SELECT id FROM borrow WHERE enrollment_id = ? AND book_id = ? AND status = "borrowed" LIMIT 1';
$stmt = $mysqli->prepare($borrowQuery);
$stmt->bind_param('si', $enrollmentId, $bookId);
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

$updateBook = 'UPDATE books SET available = 1 WHERE book_id = ?';
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
