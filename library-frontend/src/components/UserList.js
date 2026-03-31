import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('/library-api/users.php')
      .then(response => setUsers(response.data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  return (
    <div className="user-list">
      <h2>User Management</h2>
      <Link to="/add-user" className="add-btn">Add New User</Link>
      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h3>{user.name}</h3>
            <p>Email: {user.email}</p>
            <p>Phone: {user.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;