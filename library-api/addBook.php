<?php
require_once 'db.php';

$data = getRequestData();
$enrollmentId = getValue($data, ['enrollment_id', 'enrollmentId']);
$role = getValue($data, ['role']);
$title = getValue($data, ['title']);
$author = getValue($data, ['author']);
$isbn = getValue($data, ['isbn']);
$year = getValue($data, ['year', 'publishedYear']);
$coverUrl = getValue($data, ['cover_url', 'coverUrl']);

if (!$enrollmentId || !$role || !$title || !$author || !$isbn || !$year) {
    sendError('All fields are required: enrollmentId, role, title, author, isbn, year. Cover URL is optional.');
}

$checkUser = 'SELECT role FROM users WHERE enrollment_id = ? LIMIT 1';
$stmt = $mysqli->prepare($checkUser);
$stmt->bind_param('s', $enrollmentId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || $user['role'] !== 'admin') {
    sendError('Only admin users can add books.', 403);
}

$insertBook = 'INSERT INTO books (title, author, isbn, year, cover_url, available) VALUES (?, ?, ?, ?, ?, 1)';
$stmt = $mysqli->prepare($insertBook);
$stmt->bind_param('sssss', $title, $author, $isbn, $year, $coverUrl);
$executed = $stmt->execute();
$stmt->close();

if (!$executed) {
    sendError('Failed to add book.');
}

sendSuccess();
