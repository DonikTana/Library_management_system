import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddBook.css';

const genreGroups = [
  {
    label: 'Fiction',
    options: [
      'Literary Fiction',
      'Romance',
      'Mystery/Thriller',
      'Science Fiction',
      'Fantasy',
      'Historical Fiction',
      'Horror'
    ]
  },
  {
    label: 'Non-Fiction',
    options: [
      'Biography & Autobiography',
      'Memoir',
      'History',
      'Self-Help',
      'Science & Technology',
      'Education & Textbooks',
      'Travel',
      'Philosophy & Religion'
    ]
  },
  {
    label: 'Academic / Reference',
    options: [
      'Textbooks',
      'Reference Books',
      'Research Publications'
    ]
  }
];

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  genre: 'Literary Fiction',
  publishedYear: '',
  coverUrl: ''
};

const AddBook = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { bookId } = useParams();
  const isEditMode = useMemo(() => Boolean(bookId), [bookId]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    if (role !== 'admin') {
      alert('Only admins can manage books.');
      navigate('/books');
      return;
    }

    if (!isEditMode) {
      return;
    }

    const fetchBook = async () => {
      setLoading(true);
      try {
        const response = await fetch('/library-api/getBooks.php');
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          navigate('/books');
          return;
        }

        const book = (data.books || []).find((item) => String(item.book_id) === String(bookId));
        if (!book) {
          alert('Book not found.');
          navigate('/books');
          return;
        }

        setFormData({
          title: book.title || '',
          author: book.author || '',
          isbn: book.isbn || '',
          genre: book.genre || 'Literary Fiction',
          publishedYear: book.year || '',
          coverUrl: book.cover_url || ''
        });
      } catch (error) {
        alert('Failed to load book details.');
        console.error(error);
        navigate('/books');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, isEditMode, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enrollmentId = localStorage.getItem('userId');
    const endpoint = isEditMode ? '/library-api/updateBook.php' : '/library-api/addBook.php';
    const successMessage = isEditMode ? 'Book updated successfully!' : 'Book added successfully!';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          bookId,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          genre: formData.genre,
          year: formData.publishedYear,
          coverUrl: formData.coverUrl
        })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(successMessage);
      setFormData(emptyForm);
      navigate('/books');
    } catch (error) {
      alert(isEditMode ? 'Failed to update book. Please try again.' : 'Failed to add book. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="add-book">
      <h2>{isEditMode ? 'Edit Book' : 'Add New Book'}</h2>
      {loading ? (
        <p className="book-form-loading">Loading book details...</p>
      ) : (
        <form onSubmit={handleSubmit} className="book-form">
          <div className="form-group">
            <label>Title:</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Author:</label>
            <input type="text" name="author" value={formData.author} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>ISBN:</label>
            <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Genre:</label>
            <select name="genre" value={formData.genre} onChange={handleChange} required>
              {genreGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Published Year:</label>
            <input type="number" name="publishedYear" value={formData.publishedYear} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Cover Image URL:</label>
            <input type="url" name="coverUrl" value={formData.coverUrl} onChange={handleChange} placeholder="https://example.com/cover.jpg" />
          </div>
          <button type="submit" className="submit-btn">{isEditMode ? 'Save Changes' : 'Add Book'}</button>
        </form>
      )}
    </div>
  );
};

export default AddBook;
