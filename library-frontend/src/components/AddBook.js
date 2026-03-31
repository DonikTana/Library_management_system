import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddBook.css';

const AddBook = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publishedYear: '',
    coverUrl: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    if (role !== 'admin') {
      alert('Only admins can add books.');
      navigate('/books');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enrollmentId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');

    try {
      const response = await fetch('/library-api/addBook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          role,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          year: formData.publishedYear,
          coverUrl: formData.coverUrl
        })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert('Book added successfully!');
      setFormData({ title: '', author: '', isbn: '', publishedYear: '', coverUrl: '' });
      navigate('/books');
    } catch (error) {
      alert('Failed to add book. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="add-book">
      <h2>Add New Book</h2>
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
          <label>Published Year:</label>
          <input type="number" name="publishedYear" value={formData.publishedYear} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Cover Image URL:</label>
          <input type="url" name="coverUrl" value={formData.coverUrl} onChange={handleChange} placeholder="https://example.com/cover.jpg" />
        </div>
        <button type="submit" className="submit-btn">Add Book</button>
      </form>
    </div>
  );
};

export default AddBook;