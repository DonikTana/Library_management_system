import React, { useState } from 'react';
import axios from 'axios';
import './AddUser.css';

const AddUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/library-api/add_user.php', formData)
      .then(response => {
        alert('User added successfully!');
        setFormData({ name: '', email: '', phone: '' });
      })
      .catch(error => console.error('Error adding user:', error));
  };

  return (
    <div className="add-user">
      <h2>Add New User</h2>
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Phone:</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <button type="submit" className="submit-btn">Add User</button>
      </form>
    </div>
  );
};

export default AddUser;