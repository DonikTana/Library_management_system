import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BorrowBook.css';

const BorrowBook = () => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    book_id: '',
    user_id: '',
    borrow_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    axios.get('/library-api/books.php?available=1')
      .then(response => setBooks(response.data))
      .catch(error => console.error('Error fetching books:', error));

    axios.get('/library-api/users.php')
      .then(response => setUsers(response.data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/library-api/borrow_book.php', formData)
      .then(response => {
        alert('Book borrowed successfully!');
        setFormData({ book_id: '', user_id: '', borrow_date: new Date().toISOString().split('T')[0] });
      })
      .catch(error => console.error('Error borrowing book:', error));
  };

  return (
    <div className="borrow-book">
      <h2>Borrow Book</h2>
      <form onSubmit={handleSubmit} className="borrow-form">
        <div className="form-group">
          <label>Select Book:</label>
          <select name="book_id" value={formData.book_id} onChange={handleChange} required>
            <option value="">Choose a book</option>
            {books.map(book => (
              <option key={book.id} value={book.id}>{book.title} by {book.author}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Select User:</label>
          <select name="user_id" value={formData.user_id} onChange={handleChange} required>
            <option value="">Choose a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Borrow Date:</label>
          <input type="date" name="borrow_date" value={formData.borrow_date} onChange={handleChange} required />
        </div>
        <button type="submit" className="submit-btn">Borrow Book</button>
      </form>
    </div>
  );
};

export default BorrowBook;