import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    enrollmentId: '',
    fullName: '',
    email: '',
    password: '',
    role: 'user'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.enrollmentId || !formData.fullName || !formData.email || !formData.password) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('/library-api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: formData.enrollmentId,
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || 'Unexpected server response');
      }

      if (!response.ok) {
        alert(data.error || 'Registration failed. Please try again.');
        return;
      }

      if (data.error) {
        alert(data.error);
        return;
      }

      alert('Registration successful! Please login.');
      navigate('/');
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Enrollment ID</label>
            <input
              type="text"
              name="enrollmentId"
              value={formData.enrollmentId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="register-btn">Register</button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;