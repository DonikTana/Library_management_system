import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SeatLayout from './pages/SeatLayout';
import Analytics from './pages/Analytics';
import BorrowReturn from './pages/BorrowReturn';
import BookList from './components/BookList';
import AddBook from './components/AddBook';
import './App.css';

const PrivateRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');
  return userId ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/books" element={<PrivateRoute><BookList /></PrivateRoute>} />
          <Route path="/add-book" element={<PrivateRoute><AddBook /></PrivateRoute>} />
          <Route path="/edit-book/:bookId" element={<PrivateRoute><AddBook /></PrivateRoute>} />
          <Route path="/borrow" element={<PrivateRoute><BorrowReturn /></PrivateRoute>} />
          <Route path="/seats" element={<PrivateRoute><SeatLayout /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
