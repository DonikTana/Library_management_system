<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$title = getValue($data, ['title']);
$author = getValue($data, ['author']);
$isbn = getValue($data, ['isbn']);
$publisher = getValue($data, ['publisher'], '');
$genre = getValue($data, ['genre']);
$year = getValue($data, ['year', 'publishedYear']);
$coverUrl = getValue($data, ['cover_url', 'coverUrl']);
$totalQuantity = (int) getValue($data, ['total_quantity', 'totalQuantity'], 1);

if (!$enrollmentId || !$title || !$author || !$isbn || !$genre || !$year) {
    sendError('All fields are required: enrollmentId, title, author, isbn, genre, year. Cover URL is optional.');
}

if ($totalQuantity < 1) {
    sendError('Total quantity must be at least 1.');
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
    sendError('Only admin users can add books.', 403);
}

$insertBook = 'INSERT INTO books (title, author, isbn, publisher, genre, year, cover_url, available, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)';
$stmt = $mysqli->prepare($insertBook);
$stmt->bind_param('sssssssii', $title, $author, $isbn, $publisher, $genre, $year, $coverUrl, $totalQuantity, $totalQuantity);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Failed to add book.');
}

sendSuccess();
