import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.token) {
        // Store token in localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUsername', data.username);
        
        // Notify navigation component about auth change
        window.dispatchEvent(new Event('adminAuthChange'));
        
        setMessage('Admin login successful! Redirecting...');
        
        // Redirect to admin dashboard
        setTimeout(() => {
          navigate('/admin/pending');
        }, 500);
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setMessage('Admin login failed.');
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <button type="submit">Login</button>
      </form>
      {message && <div>{message}</div>}
    </div>
  );
}

export default AdminLogin;
