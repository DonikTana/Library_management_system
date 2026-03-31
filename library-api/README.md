# Library API

This backend provides a PHP API for the React frontend. It uses MySQL and returns JSON responses.

## Setup

1. Place this folder inside `xampp/htdocs/library-api`.
2. Import `schema.sql` into MySQL via phpMyAdmin or the MySQL console.
3. Update database credentials in `db.php` if needed.
4. Access endpoints at `http://localhost/library-api/`.

> Note: The registration endpoint always stores users with `role = student`.
> Create any admin user manually in the database after import if you need admin access.

## Available APIs

- `login.php` - POST JSON `{ "enrollmentId": "...", "password": "..." }`
- `register.php` - POST JSON `{ "enrollmentId": "...", "name": "...", "email": "...", "password": "..." }`
- `getBooks.php` - GET
- `addBook.php` - POST JSON `{ "enrollmentId": "...", "role": "admin", "title": "...", "author": "...", "isbn": "...", "year": "...", "coverUrl": "https://..." }` (coverUrl optional)
- `borrowBook.php` - POST JSON `{ "enrollmentId": "...", "bookId": 1 }`
- `returnBook.php` - POST JSON `{ "enrollmentId": "...", "bookId": 1 }`
- `getSeats.php` - GET
- `reserveSeat.php` - POST JSON `{ "enrollmentId": "...", "seatId": 1 }`
- `releaseSeat.php` - POST JSON `{ "enrollmentId": "...", "seatId": 1, "role": "student" }`

## Response format

Success:

```json
{ "success": true }
```

Error:

```json
{ "error": "message" }
```
