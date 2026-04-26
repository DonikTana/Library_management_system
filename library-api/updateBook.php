<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$bookId = getValue($data, ['book_id', 'bookId']);
$title = getValue($data, ['title']);
$author = getValue($data, ['author']);
$isbn = getValue($data, ['isbn']);
$publisher = getValue($data, ['publisher'], '');
$genre = getValue($data, ['genre']);
$year = getValue($data, ['year', 'publishedYear']);
$coverUrl = getValue($data, ['cover_url', 'coverUrl']);
$totalQuantity = (int) getValue($data, ['total_quantity', 'totalQuantity'], 1);

if (!$enrollmentId || !$bookId || !$title || !$author || !$isbn || !$genre || !$year) {
    sendError('All fields are required: enrollmentId, bookId, title, author, isbn, genre, year. Cover URL is optional.');
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
    sendError('Only admin users can edit books.', 403);
}

$bookCheck = $mysqli->prepare('SELECT book_id, total_quantity, available_quantity FROM books WHERE book_id = ? LIMIT 1');
$bookCheck->bind_param('i', $bookId);
$bookCheck->execute();
$bookResult = $bookCheck->get_result();
$book = $bookResult->fetch_assoc();
$bookCheck->close();

if (!$book) {
    sendError('Book not found.', 404);
}

$borrowedCopies = max(0, (int) $book['total_quantity'] - (int) $book['available_quantity']);
if ($totalQuantity < $borrowedCopies) {
    sendError('Total quantity cannot be less than currently borrowed copies.');
}

$availableQuantity = $totalQuantity - $borrowedCopies;
$available = $availableQuantity > 0 ? 1 : 0;

$updateBook = 'UPDATE books SET title = ?, author = ?, isbn = ?, publisher = ?, genre = ?, year = ?, cover_url = ?, total_quantity = ?, available_quantity = ?, available = ? WHERE book_id = ?';
$stmt = $mysqli->prepare($updateBook);
$stmt->bind_param('sssssssiiii', $title, $author, $isbn, $publisher, $genre, $year, $coverUrl, $totalQuantity, $availableQuantity, $available, $bookId);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Failed to update book.');
}

sendSuccess();
