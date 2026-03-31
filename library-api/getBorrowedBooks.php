<?php
require_once 'db.php';

$enrollmentId = getValue($_GET, ['enrollment_id', 'enrollmentId']);
$role = strtolower((string) getValue($_GET, ['role'], 'user'));

if (!$enrollmentId) {
    sendError('Enrollment ID is required.');
}

$query = '
    SELECT b.id, b.enrollment_id, b.book_id, b.borrow_date, books.title, books.author
    FROM borrow b
    INNER JOIN books ON books.book_id = b.book_id
    WHERE b.status = "borrowed"
';

if ($role !== 'admin') {
    $query .= ' AND b.enrollment_id = ?';
}

$query .= ' ORDER BY b.borrow_date DESC';

$stmt = $mysqli->prepare($query);
if ($role === 'admin') {
    $stmt->execute();
} else {
    $stmt->bind_param('s', $enrollmentId);
    $stmt->execute();
}

$result = $stmt->get_result();
$borrowedBooks = [];
while ($row = $result->fetch_assoc()) {
    $borrowedBooks[] = $row;
}
$stmt->close();

sendSuccess(['borrowedBooks' => $borrowedBooks]);
