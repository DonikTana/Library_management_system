<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$bookId = getValue($data, ['book_id', 'bookId']);

if (!$enrollmentId || !$bookId) {
    sendError('Enrollment ID and book ID are required.');
}

requireUserByEnrollmentId($mysqli, $enrollmentId);

$checkBook = 'SELECT available_quantity FROM books WHERE book_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkBook);
$stmt->bind_param('i', $bookId);
$stmt->execute();
$result = $stmt->get_result();
$book = $result->fetch_assoc();
$stmt->close();

if (!$book) {
    sendError('Book not found.');
}
if ((int) $book['available_quantity'] <= 0) {
    sendError('This book is out of stock.');
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

$updateBook = 'UPDATE books SET available = IF(available_quantity > 1, 1, 0), available_quantity = available_quantity - 1 WHERE book_id = ? AND available_quantity > 0';
$stmt = $mysqli->prepare($updateBook);
$stmt->bind_param('i', $bookId);
$updated = $stmt->execute();
$affectedRows = $stmt->affected_rows;
$stmt->close();

if ($inserted && $updated && $affectedRows === 1) {
    $mysqli->commit();
    sendSuccess();
}

$mysqli->rollback();
sendError('Borrow request failed.');
