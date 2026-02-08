import './styles/App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import UserRegister from './pages/UserRegister';
import UserLogin from './pages/UserLogin';
import UserStatus from './pages/UserStatus';
import AdminLogin from './pages/AdminLogin';
import AdminPendingUsers from './pages/AdminPendingUsers';

function Navigation() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const navigate = useNavigate();

  const linkStyle = {
    color: '#ecf0f1',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
    display: 'inline-block'
  };

  useEffect(() => {
    // Check if admin is logged in
    const checkAdminLogin = () => {
      const token = localStorage.getItem('adminToken');
      const username = localStorage.getItem('adminUsername');
      setIsAdminLoggedIn(!!token);
      setAdminUsername(username || '');
    };

    checkAdminLogin();

    // Listen for storage changes (login/logout events)
    window.addEventListener('storage', checkAdminLogin);
    
    // Custom event for same-tab updates
    window.addEventListener('adminAuthChange', checkAdminLogin);

    return () => {
      window.removeEventListener('storage', checkAdminLogin);
      window.removeEventListener('adminAuthChange', checkAdminLogin);
    };
  }, []);

  const handleAdminClick = (e) => {
    e.preventDefault();
    if (isAdminLoggedIn) {
      navigate('/admin/pending');
    } else {
      navigate('/admin/login');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    setIsAdminLoggedIn(false);
    setAdminUsername('');
    window.dispatchEvent(new Event('adminAuthChange'));
    navigate('/admin/login');
  };

  return (
    <nav style={{ 
      padding: '15px 20px', 
      backgroundColor: '#2c3e50', 
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Link to="/register" style={linkStyle}>User Register</Link>
      <span style={{ color: '#ecf0f1', margin: '0 10px' }}>|</span>
      <Link to="/login" style={linkStyle}>User Login</Link>
      <span style={{ color: '#ecf0f1', margin: '0 10px' }}>|</span>
      <Link to="/status" style={linkStyle}>User Status</Link>
      <span style={{ color: '#ecf0f1', margin: '0 10px' }}>|</span>
      <a 
        href="/admin/dashboard" 
        onClick={handleAdminClick}
        style={{
          ...linkStyle,
          backgroundColor: isAdminLoggedIn ? '#27ae60' : 'transparent',
          padding: '8px 15px',
          borderRadius: '4px',
          fontWeight: isAdminLoggedIn ? 'bold' : 'normal'
        }}
      >
        📊 Admin Dashboard
        {isAdminLoggedIn && <span style={{ fontSize: '0.85em', marginLeft: '5px' }}>({adminUsername})</span>}
      </a>
      {isAdminLoggedIn && (
        <>
          <span style={{ color: '#ecf0f1', margin: '0 10px' }}>|</span>
          <a 
            href="#" 
            onClick={handleAdminLogout} 
            style={{
              ...linkStyle,
              color: '#e74c3c',
              fontWeight: 'bold'
            }}
          >
            🚪 Logout
          </a>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/register" element={<UserRegister />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/status" element={<UserStatus />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/pending" element={<AdminPendingUsers />} />
        <Route path="/admin" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
