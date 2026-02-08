import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

function UserStatus() {
  const [query, setQuery] = useState({ username: '', email: '' });
  const [status, setStatus] = useState('');

  const handleChange = e => {
    setQuery({ ...query, [e.target.name]: e.target.value });
  };

  const handleCheck = async e => {
    e.preventDefault();
    setStatus('');
    const params = new URLSearchParams(query).toString();
    try {
      const res = await fetch(`${API_BASE}/users/status?${params}`);
      const data = await res.json();
      setStatus(data.status || data.error);
    } catch (err) {
      setStatus('Status check failed.');
    }
  };

  return (
    <div>
      <h2>Check User Status</h2>
      <form onSubmit={handleCheck}>
        <input name="username" placeholder="Username" value={query.username} onChange={handleChange} />
        <input name="email" placeholder="Email" value={query.email} onChange={handleChange} />
        <button type="submit">Check Status</button>
      </form>
      {status && <div>Status: {status}</div>}
    </div>
  );
}

export default UserStatus;
