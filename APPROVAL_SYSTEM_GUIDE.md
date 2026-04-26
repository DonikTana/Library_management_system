# Approval-Based Return System Implementation Guide

## Summary of Changes

This implementation adds an approval-based return system with fine calculation and payment tracking WITHOUT breaking existing functionality.

---

## DATABASE MIGRATION (REQUIRED FIRST STEP)

**File**: `library-api/migration_approval_system.sql`

Run these SQL queries in your MySQL database:

```sql
-- Add new columns to borrow table
ALTER TABLE borrow
ADD COLUMN IF NOT EXISTS borrowed_at DATETIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_requested_at DATETIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS returned_at DATETIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fine INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status ENUM('UNPAID','PAID') DEFAULT 'UNPAID';

-- Migrate existing data
UPDATE borrow SET borrowed_at = borrow_date WHERE borrowed_at IS NULL;
UPDATE borrow SET due_date = DATE_ADD(borrowed_at, INTERVAL 14 DAY) WHERE due_date IS NULL AND borrowed_at IS NOT NULL;
UPDATE borrow SET returned_at = return_date WHERE returned_at IS NULL AND status = 'returned' AND return_date IS NOT NULL;

-- Update status enum (CRITICAL)
ALTER TABLE borrow MODIFY status ENUM('BORROWED','PENDING','RETURNED','REJECTED') DEFAULT 'BORROWED';

-- Migrate status values to uppercase
UPDATE borrow SET status = 'BORROWED' WHERE status = 'borrowed';
UPDATE borrow SET status = 'RETURNED' WHERE status = 'returned';
```

---

## FILE CHANGES

### BACKEND (PHP)

#### 1. **borrowBook.php** (MODIFIED)
- ✅ Sets `due_date` = TODAY + 14 days
- ✅ Sets `borrowed_at` = NOW()
- ✅ Sets initial status to 'BORROWED' (uppercase)

```php
$dueDate = date('Y-m-d', strtotime('+14 days'));
$insertBorrow = 'INSERT INTO borrow (enrollment_id, book_id, borrow_date, borrowed_at, due_date, status) VALUES (?, ?, NOW(), NOW(), ?, "BORROWED")';
```

---

#### 2. **returnBook.php** (MODIFIED)
- ✅ Sets status = 'PENDING' (awaiting approval)
- ✅ Sets `return_requested_at` = NOW()
- ✅ Does NOT increase book quantity here
- ✅ Shows message: "Return request submitted. Awaiting admin approval."

```php
$updateBorrow = 'UPDATE borrow SET status = "PENDING", return_requested_at = NOW() WHERE id = ?';
sendSuccess(['message' => 'Return request submitted. Awaiting admin approval.']);
```

---

#### 3. **approveReturn.php** (NEW FILE)
**Purpose**: Admin approves the return request

**Logic**:
- Checks if user is admin
- Calculates fine: ₹3 per day overdue (using floor division)
- Sets `payment_status = 'UNPAID'` if fine > 0, else 'PAID'
- Updates status = 'RETURNED'
- Increases book quantity by 1
- Sets `returned_at` = NOW()

**Returns**:
```json
{
  "success": true,
  "message": "Return approved successfully.",
  "fine": 15,
  "payment_status": "UNPAID"
}
```

**Request**:
```json
{
  "enrollmentId": "123456789",
  "borrowId": 42
}
```

---

#### 4. **rejectReturn.php** (NEW FILE)
**Purpose**: Admin rejects the return request

**Logic**:
- Checks if user is admin
- Sets status back to 'BORROWED'
- Clears `return_requested_at`
- Does NOT change quantity or add fine
- Keeps the book visible to the student so they can request return again

**Request**:
```json
{
  "enrollmentId": "123456789",
  "borrowId": 42
}
```

---

#### 5. **payFine.php** (NEW FILE)
**Purpose**: Mark fine as paid

**Logic**:
- Only borrower or admin can pay
- Checks for status = 'RETURNED' AND fine > 0 AND payment_status = 'UNPAID'
- Updates `payment_status = 'PAID'`

**Request**:
```json
{
  "enrollmentId": "123456789",
  "borrowId": 42
}
```

---

#### 6. **getBorrowedBooks.php** (MODIFIED)
- ✅ Returns all new fields: `borrowed_at`, `return_requested_at`, `returned_at`, `due_date`, `fine`, `payment_status`
- ✅ Filters: Shows both 'BORROWED' and 'PENDING' statuses
- ✅ Admin sees all records, users see only their own

---

### FRONTEND (React)

#### 1. **BorrowReturn.js** (MODIFIED)
**New Functions Added**:
- `handleApproveReturn()` - Admin approves return
- `handleRejectReturn()` - Admin rejects return
- `handlePayFine()` - User/Admin pays fine

**Display Changes**:
- Shows due date in red if overdue
- Shows status: BORROWED / PENDING / RETURNED / REJECTED
- Shows fine amount with payment status (UNPAID/PAID)
- Shows "Approval Pending" message after return request

**Admin Buttons** (if status = PENDING):
- ✅ "Approve Return" button
- ✅ "Reject Return" button

**User Buttons** (if status = BORROWED):
- ✅ "Request Return" button (instead of "Return Book")

**Fine Payment** (if fine > 0 AND payment_status = UNPAID):
- ✅ "Pay Fine (₹X)" button

---

#### 2. **BorrowReturn.css** (MODIFIED)
**New Styles Added**:
- `.status-badge.pending` - Orange
- `.status-badge.rejected` - Purple
- `.fine-section` - Yellow warning box
- `.payment-badge` - Green (PAID) / Red (UNPAID)
- `.approve-btn`, `.reject-btn`, `.pay-fine-btn` - Action buttons
- `.text-danger` - Red overdue text

---

## WORKFLOW

### **User Flow**:
1. User borrows book → `borrowed_at`, `due_date` set automatically
2. User clicks "Request Return" → status = PENDING
3. User sees "Approval Pending" message
4. Admin approves → status = RETURNED, quantity increased, fine calculated
5. If overdue: Fine = ₹3 × days overdue
6. User pays fine (if any) → `payment_status = PAID`

### **Admin Flow**:
1. Admin sees all borrowing records with status
2. Filters: BORROWED, PENDING, RETURNED, REJECTED
3. For PENDING records: Click "Approve" or "Reject"
4. Approve: Fine auto-calculated based on due_date
5. Reject: Book goes back to BORROWED, no quantity change, student can request return again

### **Fine Calculation**:
```
if (return_date > due_date)
  fine = floor((return_date - due_date) / 1 day) × 3
else
  fine = 0
```

---

## IMPORTANT NOTES

✅ **Backward Compatible**: Old 'borrowed' and 'returned' statuses migrated to uppercase
✅ **No Quantity Increase Until Approved**: Prevents premature book availability
✅ **Fine Auto-Calculated**: Admin doesn't need to manually enter fine
✅ **Payment Tracking**: Separate field for payment status independent of return status
✅ **Floor Division**: Fine uses only full days (no fractional charges)
✅ **14-Day Lending Period**: Fixed automatically, no manual entry needed

---

## TESTING CHECKLIST

- [ ] Run migration SQL
- [ ] Borrow a book → Check `due_date` = TODAY + 14 days
- [ ] Request return → Status changes to PENDING
- [ ] Admin approves return → Book marked RETURNED, quantity increases
- [ ] Check fine calculation → Overdue books show correct fine
- [ ] Pay fine → Payment status updates to PAID
- [ ] Reject return → Status changes back to BORROWED, quantity stays same, student can request again

---

## API ENDPOINTS SUMMARY

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/library-api/borrowBook.php` | POST | Borrow book (sets due_date) |
| `/library-api/returnBook.php` | POST | Request return (status = PENDING) |
| `/library-api/approveReturn.php` | POST | Admin approves + calculates fine |
| `/library-api/rejectReturn.php` | POST | Admin rejects return |
| `/library-api/payFine.php` | POST | Mark fine as PAID |
| `/library-api/getBorrowedBooks.php` | GET | Get all records with new fields |

