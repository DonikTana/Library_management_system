<?php
require_once 'db.php';

$enrollmentId = getValue($_GET, ['enrollment_id', 'enrollmentId']);
$requestingUser = requireUserByEnrollmentId($mysqli, $enrollmentId);
if (normalizeUserRole((string) $requestingUser['role']) !== 'admin') {
    sendError('Only admin users can view analytics.', 403);
}

$topBooksSql = '
    SELECT
        books.title AS book_title,
        COUNT(*) AS borrow_count
    FROM borrow
    INNER JOIN books ON books.book_id = borrow.book_id
    GROUP BY borrow.book_id, books.title
    ORDER BY borrow_count DESC, books.title ASC
    LIMIT 10
';

$categoryDistributionSql = '
    SELECT
        books.genre AS category_name,
        COUNT(*) AS borrow_count
    FROM borrow
    INNER JOIN books ON books.book_id = borrow.book_id
    GROUP BY books.genre
    ORDER BY borrow_count DESC, books.genre ASC
';

$topBooksResult = $mysqli->query($topBooksSql);
if (!$topBooksResult) {
    sendError('Failed to fetch top borrowed books analytics.');
}

$topBorrowedBooks = [];
while ($row = $topBooksResult->fetch_assoc()) {
    $topBorrowedBooks[] = $row;
}
$topBooksResult->close();

$categoryResult = $mysqli->query($categoryDistributionSql);
if (!$categoryResult) {
    sendError('Failed to fetch category distribution analytics.');
}

$categoryDistribution = [];
while ($row = $categoryResult->fetch_assoc()) {
    $categoryDistribution[] = $row;
}
$categoryResult->close();

sendSuccess([
    'topBorrowedBooks' => $topBorrowedBooks,
    'categoryDistribution' => $categoryDistribution
]);
