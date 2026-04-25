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

      await fetchData();
      setActiveTab('return');
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

      await fetchData();
    } catch (error) {
      alert('Failed to return book.');
      console.error(error);
    }
  };

  const availableBooks = books.filter((book) => book.available === '1' || book.available === 1);
  const activeBorrowedBooks = borrowedBooks.filter((entry) => entry.status === 'borrowed');

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
          {availableBooks.length === 0 ? (
            <p className="borrow-return-message">No books are available to borrow right now.</p>
          ) : (
            <div className="borrow-cards">
              {availableBooks.map((book) => (
                <article key={book.book_id} className="borrow-card">
                  {book.cover_url && <img src={book.cover_url} alt={book.title} className="borrow-card-image" />}
                  <h3>{book.title}</h3>
                  <p>Author: {book.author}</p>
                  <p>ISBN: {book.isbn}</p>
                  <p>Published: {book.year}</p>
                  <button onClick={() => handleBorrow(book.book_id)} className="borrow-action-btn">
                    Borrow This Book
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="borrow-return-panel">
          <h2>{role === 'admin' ? 'Student Borrow Records' : 'Your Borrowed Books'}</h2>
          {borrowedBooks.length === 0 ? (
            <p className="borrow-return-message">{role === 'admin' ? 'No borrow records are available yet.' : 'There are no active borrowed books to return.'}</p>
          ) : (
            <div className="return-list">
              {borrowedBooks.map((entry) => (
                <article key={entry.id} className="return-card">
                  <div className="return-card-content">
                    <h3>{entry.title}</h3>
                    <p>Author: {entry.author}</p>
                    {role === 'admin' && <p>Student Name: {entry.student_name}</p>}
                    <p>Enrollment ID: {entry.enrollment_id}</p>
                    <p>Borrow Date: {new Date(entry.borrow_date).toLocaleString()}</p>
                    <p>Return Date: {entry.return_date ? new Date(entry.return_date).toLocaleString() : 'Not returned yet'}</p>
                    <div className="return-card-footer">
                      <span className={entry.status === 'returned' ? 'status-badge returned' : 'status-badge borrowed'}>
                        {entry.status === 'returned' ? 'Returned' : 'Borrowed'}
                      </span>
                    </div>
                  </div>
                  {entry.status === 'borrowed' && (
                    <button
                      onClick={() => handleReturn(entry.book_id, entry.enrollment_id)}
                      className="borrow-action-btn return-btn"
                    >
                      Return Book
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          {role === 'admin' && activeBorrowedBooks.length > 0 && (
            <p className="borrow-return-message admin-record-note">Admins can review all student borrow records here and return any book that is still marked as borrowed.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default BorrowReturn;
