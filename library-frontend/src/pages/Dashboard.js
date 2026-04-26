import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const DashboardIcon = ({ type }) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  const icons = {
    books: (
      <>
        <path {...common} d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
        <path {...common} d="M5 5.5v16" />
        <path {...common} d="M9 7h7" />
        <path {...common} d="M9 11h5" />
      </>
    ),
    borrow: (
      <>
        <path {...common} d="M8 7h12l-3-3" />
        <path {...common} d="M20 7l-3 3" />
        <path {...common} d="M16 17H4l3 3" />
        <path {...common} d="M4 17l3-3" />
        <rect {...common} x="8" y="10" width="8" height="5" rx="1.5" />
      </>
    ),
    seats: (
      <>
        <path {...common} d="M7 11V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4" />
        <path {...common} d="M5 11h14v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
        <path {...common} d="M8 21v-3" />
        <path {...common} d="M16 21v-3" />
      </>
    ),
    add: (
      <>
        <path {...common} d="M5 5.5A2.5 2.5 0 0 1 7.5 3H18v8" />
        <path {...common} d="M5 5.5v15A2.5 2.5 0 0 1 7.5 18H11" />
        <path {...common} d="M17 14v7" />
        <path {...common} d="M13.5 17.5h7" />
      </>
    ),
    fines: (
      <>
        <path {...common} d="M7 3h10l2 3v15l-3-1.5-2 1.5-2-1.5-2 1.5-2-1.5L5 21V6z" />
        <path {...common} d="M9 8h6" />
        <path {...common} d="M9 12h6" />
        <path {...common} d="M9 16h3" />
      </>
    ),
    analytics: (
      <>
        <path {...common} d="M4 19V5" />
        <path {...common} d="M4 19h16" />
        <rect {...common} x="7" y="11" width="3" height="5" rx="1" />
        <rect {...common} x="12" y="7" width="3" height="9" rx="1" />
        <rect {...common} x="17" y="4" width="3" height="12" rx="1" />
      </>
    )
  };

  return (
    <svg className="dashboard-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type]}
    </svg>
  );
};

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
              <div className="card-icon"><DashboardIcon type="books" /></div>
              <h3>View Books</h3>
              <p>Browse, search, edit, and explore the library catalog.</p>
            </div>
            <div className="dashboard-card" onClick={() => navigate('/borrow')}>
              <div className="card-icon"><DashboardIcon type="borrow" /></div>
              <h3>Borrow / Return Books</h3>
              <p>Manage active loans, return requests, and fine payments.</p>
            </div>
            <div className="dashboard-card" onClick={() => navigate('/seats')}>
              <div className="card-icon"><DashboardIcon type="seats" /></div>
              <h3>Study Hall Seats</h3>
              <p>Reserve seats and check availability in the study hall.</p>
            </div>
            {userRole === 'admin' && (
              <>
                <div className="dashboard-card" onClick={() => navigate('/add-book')}>
                  <div className="card-icon"><DashboardIcon type="add" /></div>
                  <h3>Add New Book</h3>
                  <p>Add catalog entries with publication details and covers.</p>
                </div>
                <div className="dashboard-card" onClick={() => navigate('/return-management')}>
                  <div className="card-icon"><DashboardIcon type="fines" /></div>
                  <h3>Return & Fines</h3>
                  <p>Approve returns, reject requests, and track unpaid fines.</p>
                </div>
                <div className="dashboard-card" onClick={() => navigate('/analytics')}>
                  <div className="card-icon"><DashboardIcon type="analytics" /></div>
                  <h3>Analytics Dashboard</h3>
                  <p>View borrowing activity and library usage statistics.</p>
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
