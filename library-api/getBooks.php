<?php
require_once 'db.php';

$query = 'SELECT book_id, title, author, isbn, year, cover_url, available FROM books ORDER BY title';
$result = $mysqli->query($query);

if (!$result) {
    sendError('Failed to fetch books.');
}

$books = [];
while ($row = $result->fetch_assoc()) {
    $books[] = $row;
}

sendSuccess(['books' => $books]);
