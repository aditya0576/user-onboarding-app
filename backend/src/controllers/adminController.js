// src/controllers/adminController.js
import poolPromise from '../models/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Admin login
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', username)
      .query('SELECT * FROM admins WHERE username = @username');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const admin = result.recordset[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    
    res.json({ token, username: admin.username, email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// Get all pending users
export async function getPendingUsers(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT u.id, u.username, u.email, s.status, u.created_at 
        FROM users u
        JOIN user_status s ON u.status_id = s.id 
        WHERE s.status = 'PENDING'
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// Approve or reject user
export async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'
    
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }
    
    const pool = await poolPromise;
    
    // Get status_id for action
    const statusResult = await pool.request()
      .input('status', action === 'APPROVE' ? 'APPROVED' : 'REJECTED')
      .query('SELECT id FROM user_status WHERE status = @status');
    
    if (statusResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Status not found.' });
    }
    
    const status_id = statusResult.recordset[0].id;
    
    const updateResult = await pool.request()
      .input('status_id', status_id)
      .input('userId', userId)
      .query('UPDATE users SET status_id = @status_id WHERE id = @userId');
    
    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    res.json({ message: `User ${action === 'APPROVE' ? 'approved' : 'rejected'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}
