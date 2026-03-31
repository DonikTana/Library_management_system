import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Analytics.css';

const Analytics = () => {
  const [stats, setStats] = useState({ total: 0, available: 0, reserved: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    if (role !== 'admin') {
      alert('Only admins can view analytics.');
      navigate('/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch('/library-api/getBooks.php');
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }

        const books = data.books || [];
        const available = books.filter((b) => b.available === '1' || b.available === 1).length;
        const reserved = books.length - available;
        setStats({ total: books.length, available, reserved });
      } catch (error) {
        alert('Failed to load analytics.');
        console.error(error);
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <div className="analytics-page">
      <h2>Analytics Dashboard</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Books</h3>
          <p>{stats.total}</p>
        </div>
        <div className="analytics-card">
          <h3>Available Books</h3>
          <p>{stats.available}</p>
        </div>
        <div className="analytics-card">
          <h3>Reserved Books</h3>
          <p>{stats.reserved}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;