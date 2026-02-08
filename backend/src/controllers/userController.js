// src/controllers/userController.js
import poolPromise from '../models/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Helper to get status_id for 'PENDING'
async function getPendingStatusId() {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('status', 'PENDING')
    .query('SELECT TOP 1 id FROM user_status WHERE status = @status');
  return result.recordset[0]?.id;
}

export async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    
    const pool = await poolPromise;
    
    // Check if user exists
    const existing = await pool.request()
      .input('username', username)
      .input('email', email)
      .query('SELECT id FROM users WHERE username = @username OR email = @email');
    
    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const status_id = await getPendingStatusId();
    
    await pool.request()
      .input('username', username)
      .input('email', email)
      .input('password_hash', password_hash)
      .input('status_id', status_id)
      .query('INSERT INTO users (username, email, password_hash, status_id) VALUES (@username, @email, @password_hash, @status_id)');
    
    res.status(201).json({ message: 'Registration successful. Awaiting approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}

export async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    
    const pool = await poolPromise;
    
    // Find user by username
    const result = await pool.request()
      .input('username', username)
      .query(`
        SELECT u.id, u.username, u.email, u.password_hash, s.status 
        FROM users u
        JOIN user_status s ON u.status_id = s.id 
        WHERE u.username = @username
      `);
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const user = result.recordset[0];
    
    // Check password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    // Only allow login if status is APPROVED
    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: `Account status: ${user.status}.` });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token, username: user.username, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// Get user status by username or email
export async function getUserStatus(req, res) {
  try {
    const { username, email } = req.query;
    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required.' });
    }
    
    const pool = await poolPromise;
    let result;
    
    if (username) {
      result = await pool.request()
        .input('username', username)
        .query('SELECT u.username, u.email, s.status FROM users u JOIN user_status s ON u.status_id = s.id WHERE u.username = @username');
    } else {
      result = await pool.request()
        .input('email', email)
        .query('SELECT u.username, u.email, s.status FROM users u JOIN user_status s ON u.status_id = s.id WHERE u.email = @email');
    }
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = result.recordset[0];
    res.json({ username: user.username, email: user.email, status: user.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}
