<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$bookId = getValue($data, ['book_id', 'bookId']);

if (!$enrollmentId || !$bookId) {
    sendError('Enrollment ID and book ID are required.');
}

requireUserByEnrollmentId($mysqli, $enrollmentId);

$checkBook = 'SELECT available FROM books WHERE book_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkBook);
$stmt->bind_param('i', $bookId);
$stmt->execute();
$result = $stmt->get_result();
$book = $result->fetch_assoc();
$stmt->close();

if (!$book) {
    sendError('Book not found.');
}
if ($book['available'] != 1) {
    sendError('This book is not available for borrowing.');
}

$checkBorrow = 'SELECT id FROM borrow WHERE enrollment_id = ? AND book_id = ? AND status = "borrowed" LIMIT 1';
$stmt = $mysqli->prepare($checkBorrow);
$stmt->bind_param('si', $enrollmentId, $bookId);
$stmt->execute();
$result = $stmt->get_result();
$existing = $result->fetch_assoc();
$stmt->close();
if ($existing) {
    sendError('You already have this book borrowed.');
}

$mysqli->begin_transaction();
$insertBorrow = 'INSERT INTO borrow (enrollment_id, book_id, borrow_date, status) VALUES (?, ?, NOW(), "borrowed")';
$stmt = $mysqli->prepare($insertBorrow);
$stmt->bind_param('si', $enrollmentId, $bookId);
$inserted = $stmt->execute();
$stmt->close();

$updateBook = 'UPDATE books SET available = 0 WHERE book_id = ?';
$stmt = $mysqli->prepare($updateBook);
$stmt->bind_param('i', $bookId);
$updated = $stmt->execute();
$stmt->close();

if ($inserted && $updated) {
    $mysqli->commit();
    sendSuccess();
}

$mysqli->rollback();
sendError('Borrow request failed.');
