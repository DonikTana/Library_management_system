import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BorrowReturn.css';

const BorrowReturn = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('userRole') || 'user';
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borrow');

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const includeHistory = role === 'admin' ? '1' : '0';
      const [booksResponse, borrowedResponse] = await Promise.all([
        fetch('/library-api/getBooks.php'),
        fetch(`/library-api/getBorrowedBooks.php?enrollmentId=${encodeURIComponent(userId)}&includeHistory=${includeHistory}`)
      ]);

      const booksData = await booksResponse.json();
      const borrowedData = await borrowedResponse.json();

      if (booksData.error) {
        alert(booksData.error);
        return;
      }

      if (borrowedData.error) {
        alert(borrowedData.error);
        return;
      }

      setBooks(booksData.books || []);
      setBorrowedBooks(borrowedData.borrowedBooks || []);
    } catch (error) {
      alert('Failed to load borrow and return data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    fetchData();
  }, [fetchData, navigate, userId]);

  const handleBorrow = async (bookId) => {
    try {
      const response = await fetch('/library-api/borrowBook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, bookId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert('Book borrowed successfully! Check the Return Books tab to request return.');
      await fetchData();
    } catch (error) {
      alert('Failed to borrow book.');
      console.error(error);
    }
  };

  const handleReturn = async (bookId, borrowerId) => {
    try {
      const response = await fetch('/library-api/returnBook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorEnrollmentId: userId,
          borrowerEnrollmentId: borrowerId,
          bookId
        })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert('Return request submitted. Awaiting admin approval.');
      await fetchData();
    } catch (error) {
      alert('Failed to request return.');
      console.error(error);
    }
  };

  const handleApproveReturn = async (borrowId) => {
    try {
      const response = await fetch('/library-api/approveReturn.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, borrowId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(`Return approved. Fine: ₹${data.fine}`);
      await fetchData();
    } catch (error) {
      alert('Failed to approve return.');
      console.error(error);
    }
  };

  const handleRejectReturn = async (borrowId) => {
    try {
      const response = await fetch('/library-api/rejectReturn.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, borrowId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(data.message || 'Return request rejected. The book can be requested again.');
      await fetchData();
    } catch (error) {
      alert('Failed to reject return.');
      console.error(error);
    }
  };

  const handlePayFine = async (borrowId) => {
    try {
      const response = await fetch('/library-api/payFine.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, borrowId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(`Fine paid: ₹${data.amount}`);
      await fetchData();
    } catch (error) {
      alert('Failed to process payment.');
      console.error(error);
    }
  };

  const activeBorrowedBooks = role === 'admin'
    ? borrowedBooks
    : borrowedBooks.filter((entry) => entry.status === 'BORROWED' || entry.status === 'PENDING');

  return (
    <div className="borrow-return-page">
      <header className="borrow-return-header">
        <button onClick={() => navigate('/dashboard')} className="borrow-return-back-btn">Back to Dashboard</button>
        <div>
          <h1>Borrow / Return Books</h1>
          <p>Borrow available books and return your active loans from one place.</p>
        </div>
      </header>

      <div className="borrow-return-tabs">
        <button
          className={activeTab === 'borrow' ? 'borrow-return-tab active' : 'borrow-return-tab'}
          onClick={() => setActiveTab('borrow')}
        >
          Borrow Books
        </button>
        <button
          className={activeTab === 'return' ? 'borrow-return-tab active' : 'borrow-return-tab'}
          onClick={() => setActiveTab('return')}
        >
          Return Books
        </button>
      </div>

      {loading ? (
        <p className="borrow-return-message">Loading data...</p>
      ) : activeTab === 'borrow' ? (
        <section className="borrow-return-panel">
          <h2>Available Books</h2>
          {books.length === 0 ? (
            <p className="borrow-return-message">No books are available right now.</p>
          ) : (
            <div className="borrow-cards">
              {books.map((book) => {
                const availableCopies = Number(book.available_quantity || 0);
                return (
                  <article key={book.book_id} className="borrow-card">
                    {book.cover_url && <img src={book.cover_url} alt={book.title} className="borrow-card-image" />}
                    <h3>{book.title}</h3>
                    <p>Author: {book.author}</p>
                    {book.publisher && <p>Publisher: {book.publisher}</p>}
                    <p>ISBN: {book.isbn}</p>
                    <p>Published: {book.year}</p>
                    <p className={availableCopies > 0 ? 'stock-message' : 'stock-message out'}>
                      {availableCopies > 0 ? `Available: ${availableCopies} copies` : 'Out of Stock'}
                    </p>
                    <button
                      onClick={() => handleBorrow(book.book_id)}
                      className="borrow-action-btn"
                      disabled={availableCopies <= 0}
                    >
                      Borrow This Book
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="borrow-return-panel">
          <h2>{role === 'admin' ? 'Student Borrow Records' : 'Your Borrowed Books'}</h2>
          {activeBorrowedBooks.length === 0 ? (
            <p className="borrow-return-message">{role === 'admin' ? 'No borrow records are available yet.' : 'There are no active borrowed books to return.'}</p>
          ) : (
            <div className="return-list">
              {activeBorrowedBooks.map((entry) => {
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = entry.due_date && entry.due_date < today && entry.status === 'BORROWED';
                const hasUnpaidFine = entry.fine > 0 && entry.payment_status === 'UNPAID';
                const statusDisplay = {
                  'BORROWED': 'Borrowed',
                  'PENDING': 'Approval Pending',
                  'RETURNED': 'Returned',
                  'REJECTED': 'Rejected'
                };
                
                return (
                  <article key={entry.id} className="return-card">
                    <div className="return-card-content">
                      <h3>{entry.title}</h3>
                      <p>Author: {entry.author}</p>
                      {role === 'admin' && <p>Student Name: {entry.student_name}</p>}
                      <p>Enrollment ID: {entry.enrollment_id}</p>
                      <p>Borrow Date: {new Date(entry.borrowed_at || entry.borrow_date).toLocaleDateString()}</p>
                      {entry.due_date && <p>Due Date: <span className={isOverdue ? 'text-danger' : ''}>{new Date(entry.due_date).toLocaleDateString()} {isOverdue ? '(OVERDUE)' : ''}</span></p>}
                      {entry.return_requested_at && <p>Return Requested: {new Date(entry.return_requested_at).toLocaleDateString()}</p>}
                      {entry.returned_at && <p>Returned: {new Date(entry.returned_at).toLocaleDateString()}</p>}
                      
                      <div className="return-status-section">
                        <span className={`status-badge ${entry.status.toLowerCase()}`}>
                          {statusDisplay[entry.status] || entry.status}
                        </span>
                      </div>

                      {entry.fine > 0 && (
                        <div className="fine-section">
                          <p>Fine: <strong>₹{entry.fine}</strong></p>
                          <p>Payment Status: <span className={`payment-badge ${entry.payment_status.toLowerCase()}`}>{entry.payment_status}</span></p>
                        </div>
                      )}
                    </div>

                    <div className="return-card-actions">
                      {entry.status === 'BORROWED' && (
                        <button
                          onClick={() => handleReturn(entry.book_id, entry.enrollment_id)}
                          className="borrow-action-btn return-btn"
                        >
                          Request Return
                        </button>
                      )}

                      {role === 'admin' && entry.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApproveReturn(entry.id)}
                            className="borrow-action-btn approve-btn"
                          >
                            Approve Return
                          </button>
                          <button
                            onClick={() => handleRejectReturn(entry.id)}
                            className="borrow-action-btn reject-btn"
                          >
                            Reject Return
                          </button>
                        </>
                      )}

                      {hasUnpaidFine && (
                        <button
                          onClick={() => handlePayFine(entry.id)}
                          className="borrow-action-btn pay-fine-btn"
                        >
                          Pay Fine (₹{entry.fine})
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {role === 'admin' && borrowedBooks.some(b => b.status === 'PENDING') && (
            <p className="borrow-return-message admin-record-note">Pending returns require admin approval before books are marked as returned.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default BorrowReturn;
