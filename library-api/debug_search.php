<?php
require_once 'db.php';

$title = $_GET['title'] ?? 'Lord of the Rings';

// Test Google Books API directly with detailed response
$url = 'https://www.googleapis.com/books/v1/volumes?q=' . urlencode('intitle:' . $title) . '&maxResults=5';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'LibrarySystem/1.0'
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = [
    'search_title' => $title,
    'search_url' => $url,
    'curl_error' => $curlError,
    'http_code' => $httpCode,
    'response_length' => strlen($response),
];

if ($response === false) {
    $result['error'] = 'Curl failed: ' . $curlError;
} else {
    $payload = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $result['error'] = 'JSON decode error: ' . json_last_error_msg();
        $result['raw_response'] = substr($response, 0, 500);
    } else {
        $result['total_items'] = $payload['totalItems'] ?? 0;
        $result['items_count'] = count($payload['items'] ?? []);
        $result['has_error'] = isset($payload['error']);
        if (isset($payload['error'])) {
            $result['error'] = $payload['error'];
        }
        if (count($payload['items'] ?? []) > 0) {
            $result['first_item'] = $payload['items'][0];
        }
    }
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
