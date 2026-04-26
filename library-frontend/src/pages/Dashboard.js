import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'user';

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-overlay">
        <header className="dashboard-header">
          <div>
            <h1>Library Management System</h1>
            <p className="user-role">Logged in as: {userRole}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
        <div className="dashboard-content">
          <div className="button-grid">
            <div className="dashboard-card" onClick={() => navigate('/books')}>
              <div className="card-icon">📚</div>
              <h3>View Books</h3>
              <p>Browse and search our book collection</p>
            </div>
            <div className="dashboard-card" onClick={() => navigate('/borrow')}>
              <div className="card-icon">🔄</div>
              <h3>Borrow / Return Books</h3>
              <p>Manage your book loans</p>
            </div>
            <div className="dashboard-card" onClick={() => navigate('/seats')}>
              <div className="card-icon">🪑</div>
              <h3>Study Hall Seats</h3>
              <p>Reserve study seats</p>
            </div>
            {userRole === 'admin' && (
              <>
                <div className="dashboard-card" onClick={() => navigate('/add-book')}>
                  <div className="card-icon">➕</div>
                  <h3>Add New Book</h3>
                  <p>Add a book with cover image</p>
                </div>
                <div className="dashboard-card" onClick={() => navigate('/return-management')}>
                  <div className="card-icon">✅</div>
                  <h3>Return & Fines</h3>
                  <p>Approve returns & track fines</p>
                </div>
                <div className="dashboard-card" onClick={() => navigate('/analytics')}>
                  <div className="card-icon">📊</div>
                  <h3>Analytics Dashboard</h3>
                  <p>View library statistics</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;