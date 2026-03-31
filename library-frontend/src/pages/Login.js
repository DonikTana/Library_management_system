import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [enrollmentId, setEnrollmentId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/library-api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, password })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      const user = data.user;
      const resolvedRole = user.role === 'student' ? 'user' : user.role;
      localStorage.setItem('userId', user.enrollment_id);
      localStorage.setItem('userRole', resolvedRole);
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Enrollment ID</label>
            <input
              type="text"
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="login-note">Your account role is detected automatically after login.</p>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
