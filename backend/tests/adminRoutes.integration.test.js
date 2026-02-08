// tests/adminRoutes.integration.test.js
import request from 'supertest';
import express from 'express';
import adminRoutes from '../src/routes/adminRoutes.js';
import poolPromise from '../src/models/db.js';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin API integration', () => {
  afterAll(async () => {
    // Close database connection pool after all tests
    try {
      const pool = await poolPromise;
      await pool.close();
    } catch (err) {
      // Pool might already be closed, ignore error
    }
  });

  it('should return 400 for missing login fields', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Username and password are required.' });
  });

  it('should return 401 for no token on pending-users', async () => {
    const res = await request(app)
      .get('/api/admin/pending-users');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'No token provided.' });
  });

  it('should return 401 for no token on update status', async () => {
    const res = await request(app)
      .patch('/api/admin/user/1/status')
      .send({ action: 'APPROVE' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'No token provided.' });
  });
});
