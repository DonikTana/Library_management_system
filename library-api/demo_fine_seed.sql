-- Demo data for testing the fine system.
-- Run this after schema.sql and migration_approval_system.sql.

USE library_db;

INSERT INTO users (enrollment_id, name, email, password, role)
VALUES
  ('DEMO_FINE_USER', 'Demo Fine Student', 'demo.fine.student@example.com', 'demo123', 'student')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role);

DELETE FROM borrow
WHERE enrollment_id = 'DEMO_FINE_USER'
  AND book_id IN (
    SELECT book_id
    FROM books
    WHERE isbn = 'DEMO-FINE-BOOK-001'
  );

DELETE FROM books
WHERE isbn = 'DEMO-FINE-BOOK-001';

INSERT INTO books (title, author, isbn, publisher, genre, year, cover_url, available, total_quantity, available_quantity)
VALUES (
  'Demo Overdue Fine Book',
  'Library Demo',
  'DEMO-FINE-BOOK-001',
  'Demo Publisher',
  'Reference',
  '2026',
  NULL,
  1,
  1,
  1
);

SET @demo_book_id = LAST_INSERT_ID();

INSERT INTO borrow (
  enrollment_id,
  book_id,
  borrow_date,
  borrowed_at,
  return_date,
  return_requested_at,
  returned_at,
  due_date,
  fine,
  payment_status,
  status
)
VALUES (
  'DEMO_FINE_USER',
  @demo_book_id,
  DATE_SUB(NOW(), INTERVAL 21 DAY),
  DATE_SUB(NOW(), INTERVAL 21 DAY),
  NULL,
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  NOW(),
  DATE_SUB(CURDATE(), INTERVAL 7 DAY),
  21,
  'UNPAID',
  'RETURNED'
);
