<?php
require_once 'db.php';

$enrollmentId = getValue($_GET, ['enrollment_id', 'enrollmentId']);
$includeHistory = getValue($_GET, ['include_history', 'includeHistory'], '0');
$includeHistory = in_array(strtolower((string) $includeHistory), ['1', 'true', 'yes'], true);

$requestingUser = requireUserByEnrollmentId($mysqli, $enrollmentId);
$role = normalizeUserRole((string) $requestingUser['role']);

$query = '
    SELECT
        b.id,
        b.enrollment_id,
        users.name AS student_name,
        b.book_id,
        books.title,
        books.author,
        b.borrow_date,
        b.return_date,
        b.status
    FROM borrow b
    INNER JOIN users ON users.enrollment_id = b.enrollment_id
    INNER JOIN books ON books.book_id = b.book_id
    WHERE 1 = 1
';

if (!$includeHistory) {
    $query .= ' AND b.status = "borrowed"';
}

if ($role !== 'admin') {
    $query .= ' AND b.enrollment_id = ?';
}

$query .= ' ORDER BY b.borrow_date DESC, b.id DESC';

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
