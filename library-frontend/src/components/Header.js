import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <h1>Library Management System</h1>
      </div>
      <nav className="nav">
        <Link to="/books" className="nav-link">Books</Link>
        <Link to="/users" className="nav-link">Users</Link>
        <Link to="/borrow" className="nav-link">Borrow</Link>
        <Link to="/return" className="nav-link">Return</Link>
      </nav>
    </header>
  );
};

export default Header;