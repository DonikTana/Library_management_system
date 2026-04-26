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
  '#0b63e6',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#475569'
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
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return '#1d74f5';
          }
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#0b63e6');
          gradient.addColorStop(0.55, '#1d74f5');
          gradient.addColorStop(1, '#22d3ee');
          return gradient;
        },
        borderRadius: 12,
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
        borderWidth: 3,
        hoverOffset: 12
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
        text: 'Top 10 Borrowed Books',
        color: '#0b1f3a',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#52667d',
          maxRotation: 35,
          minRotation: 0
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#52667d'
        },
        grid: {
          color: 'rgba(82, 102, 125, 0.14)'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#52667d',
          boxWidth: 14,
          padding: 16
        }
      },
      title: {
        display: true,
        text: 'Borrowing Distribution By Genre',
        color: '#0b1f3a',
        font: {
          size: 16,
          weight: 'bold'
        }
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
                <span className="analytics-card-label">Titles</span>
                <h3>Top Borrowed Titles</h3>
                <p>{analytics.topBorrowedBooks.length}</p>
              </div>
              <div className="analytics-card">
                <span className="analytics-card-label">Genres</span>
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
