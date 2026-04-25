<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$bookId = getValue($data, ['book_id', 'bookId']);

if (!$enrollmentId || !$bookId) {
    sendError('Enrollment ID and book ID are required.');
}

$user = requireUserByEnrollmentId($mysqli, $enrollmentId);
if (normalizeUserRole((string) $user['role']) !== 'admin') {
    sendError('Only admin users can delete books.', 403);
}

$bookCheck = $mysqli->prepare('SELECT book_id, title FROM books WHERE book_id = ? LIMIT 1');
$bookCheck->bind_param('i', $bookId);
$bookCheck->execute();
$bookResult = $bookCheck->get_result();
$book = $bookResult->fetch_assoc();
$bookCheck->close();

if (!$book) {
    sendError('Book not found.', 404);
}

$borrowCheck = $mysqli->prepare('SELECT id FROM borrow WHERE book_id = ? LIMIT 1');
$borrowCheck->bind_param('i', $bookId);
$borrowCheck->execute();
$borrowResult = $borrowCheck->get_result();
$borrowExists = $borrowResult->fetch_assoc();
$borrowCheck->close();

if ($borrowExists) {
    sendError('This book cannot be deleted because borrow records already exist for it.');
}

$deleteBook = $mysqli->prepare('DELETE FROM books WHERE book_id = ?');
$deleteBook->bind_param('i', $bookId);
$executed = $deleteBook->execute();
$deleteBook->close();

if (!$executed) {
    sendError('Failed to delete book.');
}

sendSuccess();
