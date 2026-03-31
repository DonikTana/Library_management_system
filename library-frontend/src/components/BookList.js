import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookList.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'user';

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('/library-api/getBooks.php');
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
        setBooks(data.books || []);
      } catch (error) {
        alert('Failed to load books.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="book-list">
      <h2>Book Catalog</h2>
      {userRole === 'admin' && (
        <button onClick={() => navigate('/add-book')} className="add-btn">Add New Book</button>
      )}
      <div className="books-grid">
        {loading ? (
          <p>Loading books...</p>
        ) : books.length === 0 ? (
          <p>No books available. {userRole === 'admin' ? 'Add some books.' : 'Please check back later.'}</p>
        ) : (
          books.map(book => (
            <div key={book.book_id} className="book-card">
              {book.cover_url && <img src={book.cover_url} alt={book.title} className="book-cover" />}
              <h3>{book.title}</h3>
              <p>Author: {book.author}</p>
              <p>ISBN: {book.isbn}</p>
              <p>Published: {book.year}</p>
              <p>Available: {book.available ? 'Yes' : 'No'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookList;