// src/routes/adminRoutes.js
import express from 'express';
import { adminLogin, getPendingUsers, updateUserStatus } from '../controllers/adminController.js';
import { verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// POST /api/admin/login (no auth required)
router.post('/login', adminLogin);

// GET /api/admin/pending-users (admin auth required)
router.get('/pending-users', verifyAdmin, getPendingUsers);

// PATCH /api/admin/user/:userId/status (admin auth required)
router.patch('/user/:userId/status', verifyAdmin, updateUserStatus);

export default router;
