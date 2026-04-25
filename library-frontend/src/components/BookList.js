import React, { useDeferredValue, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookList.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'user';
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    fetchBooks();
  }, []);

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

  const handleDeleteBook = async (bookId, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/library-api/deleteBook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: localStorage.getItem('userId'),
          bookId
        })
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      fetchBooks();
    } catch (error) {
      alert('Failed to delete book.');
      console.error(error);
    }
  };

  const genres = ['All Genres', ...new Set(books.map((book) => book.genre).filter(Boolean))];
  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const filteredBooks = books.filter((book) => {
    const matchesGenre = selectedGenre === 'All Genres' || book.genre === selectedGenre;
    if (!matchesGenre) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      book.title,
      book.author,
      book.isbn,
      book.genre,
      book.year
    ].join(' ').toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <div className="book-list">
      <h2>Book Catalog</h2>
      {userRole === 'admin' && (
        <button onClick={() => navigate('/add-book')} className="add-btn">Add New Book</button>
      )}
      <div className="catalog-toolbar">
        <div className="catalog-control">
          <label htmlFor="book-search">Search Books</label>
          <input
            id="book-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, author, ISBN, genre..."
          />
        </div>
        <div className="catalog-control">
          <label htmlFor="genre-filter">Filter By Genre</label>
          <select
            id="genre-filter"
            value={selectedGenre}
            onChange={(event) => setSelectedGenre(event.target.value)}
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="catalog-results">{filteredBooks.length} book{filteredBooks.length === 1 ? '' : 's'} found</p>
      <div className="books-grid">
        {loading ? (
          <p>Loading books...</p>
        ) : books.length === 0 ? (
          <p>No books available. {userRole === 'admin' ? 'Add some books.' : 'Please check back later.'}</p>
        ) : filteredBooks.length === 0 ? (
          <p>No books match your current search or genre filter.</p>
        ) : (
          filteredBooks.map(book => (
            <div key={book.book_id} className="book-card">
              {book.cover_url && <img src={book.cover_url} alt={book.title} className="book-cover" />}
              <span className="genre-pill">{book.genre}</span>
              <h3>{book.title}</h3>
              <p>Author: {book.author}</p>
              <p>ISBN: {book.isbn}</p>
              <p>Published: {book.year}</p>
              <p>Available: {book.available ? 'Yes' : 'No'}</p>
              {userRole === 'admin' && (
                <div className="book-card-actions">
                  <button onClick={() => navigate(`/edit-book/${book.book_id}`)} className="book-action-btn edit-book-btn">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteBook(book.book_id, book.title)} className="book-action-btn delete-book-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookList;
