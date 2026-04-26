<?php
require_once 'db.php';

$enrollmentId = getValue($_GET, ['enrollment_id', 'enrollmentId']);
$title = getValue($_GET, ['title']);

if (!$enrollmentId || !$title) {
    sendError('Enrollment ID and title are required.');
}

$user = requireUserByEnrollmentId($mysqli, $enrollmentId);
if (normalizeUserRole((string) $user['role']) !== 'admin') {
    sendError('Only admin users can search external book APIs.', 403);
}

// Check cache first (cache for 24 hours)
$cacheDir = __DIR__ . '/.cache';
$cacheKey = md5('google_books_' . $title);
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
$cacheExpiry = 24 * 60 * 60; // 24 hours

if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0777, true);
}

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheExpiry) {
    $cachedData = json_decode(file_get_contents($cacheFile), true);
    if ($cachedData) {
        sendSuccess(['books' => $cachedData, 'cached' => true]);
    }
}

// Google Books API key from environment variable
// Set in .env file, get one free at: https://console.cloud.google.com/apis/library/books.googleapis.com
$apiKey = getenv('GOOGLE_BOOKS_API_KEY') ?: '';

if (empty($apiKey)) {
    sendError('Google Books API key not configured. Please add GOOGLE_BOOKS_API_KEY to .env file.');
}

$url = 'https://www.googleapis.com/books/v1/volumes?q=' . urlencode('intitle:' . $title) . '&maxResults=10';
if ($apiKey) {
    $url .= '&key=' . urlencode($apiKey);
}

// Use curl for better reliability and error handling
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'LibraryManagementSystem/1.0'
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    sendError('Failed to connect to Google Books API: ' . ($curlError ?: 'Unknown error'));
}

$payload = json_decode($response, true);
if (!is_array($payload)) {
    sendError('Invalid JSON response from Google Books: ' . substr($response, 0, 200));
}

// Check for API error response
if (isset($payload['error'])) {
    if (is_array($payload['error']) && isset($payload['error']['code'])) {
        if ($payload['error']['code'] == 429) {
            sendError('Google Books API rate limit exceeded. Please try again later or add an API key to searchBookApi.php');
        }
        sendError('Google Books API Error: ' . ($payload['error']['message'] ?? 'Unknown error'));
    } else {
        sendError('Google Books API Error: ' . json_encode($payload['error']));
    }
}

// Check if we got any results
if (!isset($payload['items']) || count($payload['items']) === 0) {
    sendSuccess(['books' => []]); // No results found, but valid response
}

// Debug logging
error_log('Google Books Search: title=' . $title . ', httpCode=' . $httpCode . ', items=' . count($payload['items'] ?? []) . ', totalItems=' . ($payload['totalItems'] ?? 0));

$books = [];
foreach (($payload['items'] ?? []) as $item) {
    $info = $item['volumeInfo'] ?? [];
    $isbn = '';
    foreach (($info['industryIdentifiers'] ?? []) as $identifier) {
        if (!empty($identifier['identifier'])) {
            $isbn = $identifier['identifier'];
            break;
        }
    }

    $books[] = [
        'title' => $info['title'] ?? '',
        'author' => implode(', ', $info['authors'] ?? []),
        'publisher' => $info['publisher'] ?? '',
        'isbn' => $isbn,
        'publishedYear' => substr((string) ($info['publishedDate'] ?? ''), 0, 4),
        'coverUrl' => $info['imageLinks']['thumbnail'] ?? ''
    ];
}

// Cache the results
@file_put_contents($cacheFile, json_encode($books));

sendSuccess(['books' => $books]);
