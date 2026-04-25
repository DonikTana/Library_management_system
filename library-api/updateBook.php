<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$bookId = getValue($data, ['book_id', 'bookId']);
$title = getValue($data, ['title']);
$author = getValue($data, ['author']);
$isbn = getValue($data, ['isbn']);
$genre = getValue($data, ['genre']);
$year = getValue($data, ['year', 'publishedYear']);
$coverUrl = getValue($data, ['cover_url', 'coverUrl']);

if (!$enrollmentId || !$bookId || !$title || !$author || !$isbn || !$genre || !$year) {
    sendError('All fields are required: enrollmentId, bookId, title, author, isbn, genre, year. Cover URL is optional.');
}

$allowedGenres = [
    'Literary Fiction',
    'Romance',
    'Mystery/Thriller',
    'Science Fiction',
    'Fantasy',
    'Historical Fiction',
    'Horror',
    'Biography & Autobiography',
    'Memoir',
    'History',
    'Self-Help',
    'Science & Technology',
    'Education & Textbooks',
    'Travel',
    'Philosophy & Religion',
    'Textbooks',
    'Reference Books',
    'Research Publications'
];

if (!in_array($genre, $allowedGenres, true)) {
    sendError('Please choose a valid genre from the list.');
}

$user = requireUserByEnrollmentId($mysqli, $enrollmentId);
if (normalizeUserRole((string) $user['role']) !== 'admin') {
    sendError('Only admin users can edit books.', 403);
}

$bookCheck = $mysqli->prepare('SELECT book_id FROM books WHERE book_id = ? LIMIT 1');
$bookCheck->bind_param('i', $bookId);
$bookCheck->execute();
$bookResult = $bookCheck->get_result();
$book = $bookResult->fetch_assoc();
$bookCheck->close();

if (!$book) {
    sendError('Book not found.', 404);
}

$updateBook = 'UPDATE books SET title = ?, author = ?, isbn = ?, genre = ?, year = ?, cover_url = ? WHERE book_id = ?';
$stmt = $mysqli->prepare($updateBook);
$stmt->bind_param('ssssssi', $title, $author, $isbn, $genre, $year, $coverUrl, $bookId);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Failed to update book.');
}

sendSuccess();
