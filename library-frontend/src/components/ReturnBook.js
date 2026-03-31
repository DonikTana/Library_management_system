import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReturnBook.css';

const ReturnBook = () => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [selectedBorrow, setSelectedBorrow] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    axios.get('/library-api/borrowed_books.php')
      .then(response => setBorrowedBooks(response.data))
      .catch(error => console.error('Error fetching borrowed books:', error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/library-api/return_book.php', {
      borrow_id: selectedBorrow,
      return_date: returnDate
    })
      .then(response => {
        alert('Book returned successfully!');
        setSelectedBorrow('');
        setReturnDate(new Date().toISOString().split('T')[0]);
        // Refresh list
        axios.get('/library-api/borrowed_books.php')
          .then(response => setBorrowedBooks(response.data));
      })
      .catch(error => console.error('Error returning book:', error));
  };

  return (
    <div className="return-book">
      <h2>Return Book</h2>
      <form onSubmit={handleSubmit} className="return-form">
        <div className="form-group">
          <label>Select Borrowed Book:</label>
          <select value={selectedBorrow} onChange={(e) => setSelectedBorrow(e.target.value)} required>
            <option value="">Choose a borrowed book</option>
            {borrowedBooks.map(borrow => (
              <option key={borrow.id} value={borrow.id}>
                {borrow.book_title} borrowed by {borrow.user_name} on {borrow.borrow_date}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Return Date:</label>
          <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
        </div>
        <button type="submit" className="submit-btn">Return Book</button>
      </form>
    </div>
  );
};

export default ReturnBook;