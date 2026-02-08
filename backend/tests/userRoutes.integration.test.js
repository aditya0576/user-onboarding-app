// tests/userRoutes.integration.test.js
import request from 'supertest';
import express from 'express';
import userRoutes from '../src/routes/userRoutes.js';
import poolPromise from '../src/models/db.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User API integration', () => {
  afterAll(async () => {
    // Close database connection pool after all tests
    try {
      const pool = await poolPromise;
      await pool.close();
    } catch (err) {
      // Pool might already be closed, ignore error
    }
  });

  it('should return 400 for missing registration fields', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'All fields are required.' });
  });

  it('should return 400 for missing login fields', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Username and password are required.' });
  });

  it('should return 400 for missing status query', async () => {
    const res = await request(app)
      .get('/api/users/status');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Username or email is required.' });
  });
});
