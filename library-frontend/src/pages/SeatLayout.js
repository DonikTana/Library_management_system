import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SeatLayout.css';

const SeatLayout = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('userRole') || 'user';
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  const orderedSeats = [...seats]
    .sort((firstSeat, secondSeat) => Number(firstSeat.seat_id) - Number(secondSeat.seat_id))
    .slice(0, 30);

  const fetchSeats = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch('/library-api/getSeats.php');
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setSeats(data.seats || []);
    } catch (error) {
      alert('Failed to load seats.');
      console.error(error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    fetchSeats();
    const intervalId = setInterval(() => {
      fetchSeats(false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [navigate, userId]);

  const handleSeatClick = async (seatId) => {
    const seat = seats.find((item) => item.seat_id === seatId);
    if (!seat) {
      return;
    }

    const isMine = seat.enrollment_id === userId;
    if (seat.status === 'available') {
      try {
        const response = await fetch('/library-api/reserveSeat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollmentId: userId, seatId })
        });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
        fetchSeats(false);
      } catch (error) {
        alert('Failed to reserve seat.');
        console.error(error);
      }
      return;
    }

    if (seat.status === 'reserved' && (isMine || role === 'admin')) {
      try {
        const response = await fetch('/library-api/releaseSeat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollmentId: userId, seatId })
        });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
        fetchSeats(false);
      } catch (error) {
        alert('Failed to release seat.');
        console.error(error);
      }
      return;
    }

    alert('This seat is already reserved by another user.');
  };

  const handleResetSeats = async () => {
    const confirmed = window.confirm('Reset all seat bookings? This will cancel every reservation.');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/library-api/resetSeats.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId })
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      fetchSeats(false);
    } catch (error) {
      alert('Failed to reset seats.');
      console.error(error);
    }
  };

  const getSeatStatus = (seat) => {
    if (seat.status === 'available') {
      return 'available';
    }
    if (seat.enrollment_id === userId) {
      return 'mine';
    }
    return 'reserved';
  };

  const getSeatClass = (status) => {
    switch (status) {
      case 'available':
        return 'seat-available';
      case 'reserved':
        return 'seat-reserved';
      case 'mine':
        return 'seat-mine';
      default:
        return 'seat-available';
    }
  };

  const availableCount = orderedSeats.filter((seat) => seat.status === 'available').length;
  const mySeatCount = orderedSeats.filter((seat) => seat.enrollment_id === userId && seat.status === 'reserved').length;
  const reservedCount = orderedSeats.length - availableCount;

  return (
    <div className="seat-layout-container">
      <div className="seat-layout-shell">
        <header className="seat-header">
          <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
          <div className="seat-header-copy">
            <h1 className="seat-eyebrow">Study Hall Reservation</h1>
            <h2>Choose From 30 Ordered Seats</h2>
            <p>Green seats are free, red seats are reserved, and blue marks your own booking.</p>
          </div>
          {role === 'admin' && (
            <button onClick={handleResetSeats} className="reset-btn">Reset All Seats</button>
          )}
        </header>

        <section className="seat-summary">
          <div className="seat-stat available">
            <span className="seat-stat-label">Available</span>
            <strong>{availableCount}</strong>
          </div>
          <div className="seat-stat reserved">
            <span className="seat-stat-label">Reserved</span>
            <strong>{reservedCount}</strong>
          </div>
          <div className="seat-stat mine">
            <span className="seat-stat-label">Your Seat</span>
            <strong>{mySeatCount}</strong>
          </div>
        </section>

        <section className="seat-board">
          <div className="seat-board-top">
            <div>
              <h2>Seat Map</h2>
              <p>Tap a green seat to reserve it. Tap your blue seat to release it.</p>
            </div>
            <span className="seat-board-badge">30 Seats</span>
          </div>

          <div className="seat-grid">
            {loading ? (
              <p className="seat-message">Loading seats...</p>
            ) : orderedSeats.length === 0 ? (
              <p className="seat-message">No seat data available.</p>
            ) : (
              orderedSeats.map((seat) => {
                const status = getSeatStatus(seat);
                return (
                  <button
                    key={seat.seat_id}
                    type="button"
                    className={`seat ${getSeatClass(status)}`}
                    onClick={() => handleSeatClick(seat.seat_id)}
                    title={status === 'reserved' && role === 'admin' ? 'Click to release this reservation' : 'Click to manage seat'}
                  >
                    <span className="seat-label">Seat</span>
                    <span className="seat-number">{String(seat.seat_id).padStart(2, '0')}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <div className="legend">
          <h3>Seat Status</h3>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-swatch seat-available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-swatch seat-reserved"></div>
              <span>Reserved By Others</span>
            </div>
            <div className="legend-item">
              <div className="legend-swatch seat-mine"></div>
              <span>Your Reserved Seat</span>
            </div>
          </div>
          {role === 'admin' && (
            <p className="admin-note">Admins can reserve a free seat, release any reserved seat, and reset all bookings.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;
