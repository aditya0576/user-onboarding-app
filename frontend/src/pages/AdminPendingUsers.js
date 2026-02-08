import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

function AdminPendingUsers() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('adminToken');
    const username = localStorage.getItem('adminUsername');
    
    if (!token) {
      setMessage('No admin token found. Please login first.');
      setTimeout(() => navigate('/admin/login'), 2000);
      return;
    }
    
    setAdminUsername(username || 'Admin');
    // Automatically fetch pending users on component mount
    fetchPending(token);
  }, [navigate]);

  const fetchPending = async (tokenOverride) => {
    setMessage('');
    const token = tokenOverride || localStorage.getItem('adminToken');
    
    if (!token) {
      setMessage('Please login first.');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/admin/pending-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.status === 401) {
        setMessage('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        setTimeout(() => navigate('/admin/login'), 2000);
        return;
      }
      
      setUsers(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setMessage(data.error);
    } catch (err) {
      setMessage('Failed to fetch pending users.');
    }
  };

  const handleAction = async (userId, action) => {
    setMessage('');
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      setMessage('Please login first.');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/admin/user/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      
      if (res.ok) {
        // Refresh the list after successful action
        setTimeout(() => fetchPending(), 500);
      }
    } catch (err) {
      setMessage('Failed to update user status.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    window.dispatchEvent(new Event('adminAuthChange'));
    navigate('/admin/login');
  };

  return (
    <div>
      <h2>Admin Dashboard - Pending Users</h2>
      {adminUsername && (
        <p>
          Logged in as: <strong>{adminUsername}</strong>{' '}
          <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
        </p>
      )}
      <button onClick={() => fetchPending()}>Refresh List</button>
      {message && <div style={{ 
        padding: '10px', 
        margin: '10px 0',
        backgroundColor: message.includes('success') || message.includes('approved') || message.includes('rejected') ? '#d4edda' : '#f8d7da',
        color: message.includes('success') || message.includes('approved') || message.includes('rejected') ? '#155724' : '#721c24',
        border: '1px solid',
        borderRadius: '4px'
      }}>{message}</div>}
      
      {users.length === 0 ? (
        <p>No pending users at the moment.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Username</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Created</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.username}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.email}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                  <button 
                    onClick={() => handleAction(user.id, 'APPROVE')}
                    style={{ 
                      marginRight: '5px', 
                      padding: '5px 10px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(user.id, 'REJECT')}
                    style={{ 
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPendingUsers;
