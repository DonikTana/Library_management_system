import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../styles/Analytics.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Title, Tooltip);

const piePalette = [
  '#295db6',
  '#2a9d8f',
  '#e76f51',
  '#f4a261',
  '#8ab17d',
  '#6d597a',
  '#457b9d',
  '#d62828',
  '#7f5539',
  '#4d908e'
];

const Analytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    topBorrowedBooks: [],
    categoryDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    if (role !== 'admin') {
      alert('Only admins can view analytics.');
      navigate('/dashboard');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const enrollmentId = localStorage.getItem('userId');
        const response = await fetch(`/library-api/getAnalytics.php?enrollmentId=${encodeURIComponent(enrollmentId)}`);
        const data = await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        setAnalytics({
          topBorrowedBooks: data.topBorrowedBooks || [],
          categoryDistribution: data.categoryDistribution || []
        });
      } catch (error) {
        alert('Failed to load analytics.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  const topBorrowedBooksChart = {
    labels: analytics.topBorrowedBooks.map((item) => item.book_title),
    datasets: [
      {
        label: 'Borrow Count',
        data: analytics.topBorrowedBooks.map((item) => Number(item.borrow_count)),
        backgroundColor: '#3c6ed8',
        borderRadius: 10,
        maxBarThickness: 48
      }
    ]
  };

  const categoryDistributionChart = {
    labels: analytics.categoryDistribution.map((item) => item.category_name),
    datasets: [
      {
        data: analytics.categoryDistribution.map((item) => Number(item.borrow_count)),
        backgroundColor: analytics.categoryDistribution.map((_, index) => piePalette[index % piePalette.length]),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const topBooksOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 10 Borrowed Books'
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#52627a'
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#52627a'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Borrowing Distribution By Genre'
      }
    }
  };

  return (
    <div className="analytics-page">
      <div className="analytics-shell">
        <header className="analytics-header">
          <div>
            <p className="analytics-eyebrow">Admin Insights</p>
            <h2>Library Analytics Dashboard</h2>
            <p>Track which books are borrowed most often and how demand is distributed across genres.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="analytics-back-btn">Back to Dashboard</button>
        </header>

        {loading ? (
          <p className="analytics-loading">Loading analytics...</p>
        ) : (
          <>
            <section className="analytics-summary">
              <div className="analytics-card">
                <h3>Top Borrowed Titles</h3>
                <p>{analytics.topBorrowedBooks.length}</p>
              </div>
              <div className="analytics-card">
                <h3>Genres In Borrow History</h3>
                <p>{analytics.categoryDistribution.length}</p>
              </div>
            </section>

            <section className="analytics-charts">
              <article className="chart-card chart-card-wide">
                <div className="chart-wrap">
                  <Bar data={topBorrowedBooksChart} options={topBooksOptions} />
                </div>
              </article>
              <article className="chart-card">
                <div className="chart-wrap">
                  <Pie data={categoryDistributionChart} options={pieOptions} />
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
