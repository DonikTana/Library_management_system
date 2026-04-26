-- ALTER TABLE borrow to support approval-based return system with fines
-- Run these migration queries:

ALTER TABLE borrow
ADD COLUMN IF NOT EXISTS borrowed_at DATETIME DEFAULT NULL AFTER borrow_date,
ADD COLUMN IF NOT EXISTS return_requested_at DATETIME DEFAULT NULL AFTER return_date,
ADD COLUMN IF NOT EXISTS returned_at DATETIME DEFAULT NULL AFTER return_requested_at,
ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL AFTER returned_at,
ADD COLUMN IF NOT EXISTS fine INT DEFAULT 0 AFTER due_date,
ADD COLUMN IF NOT EXISTS payment_status ENUM('UNPAID','PAID') DEFAULT 'UNPAID' AFTER fine;

-- Migrate existing data
UPDATE borrow SET borrowed_at = borrow_date WHERE borrowed_at IS NULL;
UPDATE borrow SET due_date = DATE_ADD(borrowed_at, INTERVAL 14 DAY) WHERE due_date IS NULL AND borrowed_at IS NOT NULL;
UPDATE borrow SET returned_at = return_date WHERE returned_at IS NULL AND status = 'returned' AND return_date IS NOT NULL;

-- Temporarily allow old and new statuses during migration
ALTER TABLE borrow MODIFY status ENUM('borrowed','returned','BORROWED','PENDING','RETURNED','REJECTED') DEFAULT 'BORROWED';

-- Migrate old 'borrowed' status to 'BORROWED'
UPDATE borrow SET status = 'BORROWED' WHERE status = 'borrowed';

-- Migrate old 'returned' status to 'RETURNED'
UPDATE borrow SET status = 'RETURNED' WHERE status = 'returned';

-- Keep REJECTED in the enum for compatibility with any existing rejected rows.
-- New rejected return requests are reset to BORROWED so students can request return again.
ALTER TABLE borrow MODIFY status ENUM('BORROWED','PENDING','RETURNED','REJECTED') DEFAULT 'BORROWED';
