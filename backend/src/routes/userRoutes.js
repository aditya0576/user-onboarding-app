// src/routes/userRoutes.js
import express from 'express';
import { registerUser, loginUser, getUserStatus } from '../controllers/userController.js';

const router = express.Router();

// GET /api/users/status?username=... or ?email=...
router.get('/status', getUserStatus);

// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

export default router;
