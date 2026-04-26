import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminReturnManagement.css';

const AdminReturnManagement = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('userRole') || 'user';
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/library-api/getBorrowedBooks.php?enrollmentId=${encodeURIComponent(userId)}&includeHistory=1`);
      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setBorrowRecords(data.borrowedBooks || []);
    } catch (error) {
      alert('Failed to load records.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (role !== 'admin') {
      alert('Only admins can access this page.');
      navigate('/dashboard');
      return;
    }

    fetchData();
  }, [fetchData, role, navigate]);

  const handleApproveReturn = async (borrowId) => {
    try {
      const response = await fetch('/library-api/approveReturn.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, borrowId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(`Return approved. Fine: Rs. ${data.fine}`);
      await fetchData();
    } catch (error) {
      alert('Failed to approve return.');
      console.error(error);
    }
  };

  const handleRejectReturn = async (borrowId) => {
    try {
      const response = await fetch('/library-api/rejectReturn.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, borrowId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(data.message || 'Return request rejected. The book remains borrowed.');
      await fetchData();
    } catch (error) {
      alert('Failed to reject return.');
      console.error(error);
    }
  };

  const handlePayFine = async (borrowId) => {
    try {
      const response = await fetch('/library-api/payFine.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: userId, borrowId })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      alert(`Fine paid: Rs. ${data.amount}`);
      await fetchData();
    } catch (error) {
      alert('Failed to process payment.');
      console.error(error);
    }
  };

  const pendingReturns = borrowRecords.filter(b => b.status === 'PENDING');
  const unpaidFines = borrowRecords.filter(b => b.fine > 0 && b.payment_status === 'UNPAID');
  const allBorrows = borrowRecords.filter(b => ['BORROWED', 'PENDING', 'RETURNED'].includes(b.status));

  return (
    <div className="admin-return-page">
      <header className="admin-return-header">
        <button onClick={() => navigate('/dashboard')} className="admin-return-back-btn">Back to Dashboard</button>
        <div>
          <h1>Return & Fine Management</h1>
          <p>Manage pending returns, approve requests, and track fines.</p>
        </div>
      </header>

      <div className="admin-return-stats">
        <div className="stat-card">
          <h3>{pendingReturns.length}</h3>
          <p>Pending Approvals</p>
        </div>
        <div className="stat-card">
          <h3>{unpaidFines.length}</h3>
          <p>Unpaid Fines</p>
        </div>
        <div className="stat-card">
          <h3>Rs. {unpaidFines.reduce((sum, b) => sum + (b.fine || 0), 0)}</h3>
          <p>Total Due</p>
        </div>
      </div>

      <div className="admin-return-tabs">
        <button
          className={activeTab === 'pending' ? 'admin-return-tab active' : 'admin-return-tab'}
          onClick={() => setActiveTab('pending')}
        >
          Pending Returns ({pendingReturns.length})
        </button>
        <button
          className={activeTab === 'fines' ? 'admin-return-tab active' : 'admin-return-tab'}
          onClick={() => setActiveTab('fines')}
        >
          Unpaid Fines ({unpaidFines.length})
        </button>
        <button
          className={activeTab === 'all' ? 'admin-return-tab active' : 'admin-return-tab'}
          onClick={() => setActiveTab('all')}
        >
          All Records
        </button>
      </div>

      {loading ? (
        <p className="admin-return-message">Loading...</p>
      ) : (
        <>
          {activeTab === 'pending' && (
            <section className="admin-return-panel">
              <h2>Pending Return Approvals</h2>
              {pendingReturns.length === 0 ? (
                <p className="admin-return-message">No pending returns to approve.</p>
              ) : (
                <div className="return-records">
                  {pendingReturns.map((record) => {
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = record.due_date && record.due_date < today;

                    return (
                      <article key={record.id} className="record-card">
                        <div className="record-header">
                          <h3>{record.title}</h3>
                          <span className={`status-badge ${isOverdue ? 'overdue' : 'ontime'}`}>
                            {isOverdue ? 'Overdue' : 'On Time'}
                          </span>
                        </div>

                        <div className="record-body">
                          <p><strong>Student:</strong> {record.student_name} ({record.enrollment_id})</p>
                          <p><strong>Author:</strong> {record.author}</p>
                          <p><strong>Borrowed:</strong> {new Date(record.borrowed_at).toLocaleDateString()}</p>
                          <p><strong>Due Date:</strong> {new Date(record.due_date).toLocaleDateString()}</p>
                          <p><strong>Return Requested:</strong> {new Date(record.return_requested_at).toLocaleDateString()}</p>
                        </div>

                        <div className="record-actions">
                          <button onClick={() => handleApproveReturn(record.id)} className="btn btn-approve">
                            Approve Return
                          </button>
                          <button onClick={() => handleRejectReturn(record.id)} className="btn btn-reject">
                            Reject Return
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'fines' && (
            <section className="admin-return-panel">
              <h2>Student Unpaid Fines</h2>
              {unpaidFines.length === 0 ? (
                <p className="admin-return-message">All fines have been paid.</p>
              ) : (
                <div className="fines-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Enrollment ID</th>
                        <th>Book Title</th>
                        <th>Due Date</th>
                        <th>Fine Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidFines.map((record) => (
                        <tr key={record.id}>
                          <td>{record.student_name}</td>
                          <td>{record.enrollment_id}</td>
                          <td>{record.title}</td>
                          <td>{new Date(record.due_date).toLocaleDateString()}</td>
                          <td className="fine-amount">Rs. {record.fine}</td>
                          <td>
                            <span className="payment-badge unpaid">UNPAID</span>
                          </td>
                          <td>
                            <button onClick={() => handlePayFine(record.id)} className="btn btn-small btn-pay">
                              Mark Paid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'all' && (
            <section className="admin-return-panel">
              <h2>All Borrow Records</h2>
              <div className="all-records">
                {allBorrows.map((record) => {
                  const statusColors = {
                    'BORROWED': 'borrowed',
                    'PENDING': 'pending',
                    'RETURNED': 'returned'
                  };

                  return (
                    <article key={record.id} className={`record-card-mini ${statusColors[record.status]}`}>
                      <div className="mini-record-header">
                        <h4>{record.title}</h4>
                        <span className={`mini-status ${statusColors[record.status]}`}>{record.status}</span>
                      </div>
                      <p className="mini-student">{record.student_name} ({record.enrollment_id})</p>
                      <p className="mini-dates">
                        Borrowed: {new Date(record.borrowed_at).toLocaleDateString()} | Due: {new Date(record.due_date).toLocaleDateString()}
                      </p>
                      {record.fine > 0 && (
                        <p className="mini-fine">Fine: <strong>Rs. {record.fine}</strong> - {record.payment_status}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReturnManagement;
