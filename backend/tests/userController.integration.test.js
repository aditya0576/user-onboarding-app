import { registerUser, loginUser, getUserStatus } from '../src/controllers/userController.js';
import poolPromise from '../src/models/db.js';

describe('User Controller Integration Tests (Real Azure SQL Database)', () => {
  let pool;
  const testUsername = `testuser_${Date.now()}`;
  const testEmail = `testuser_${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  let testUserId;

  beforeAll(async () => {
    pool = await poolPromise;
  });

  afterAll(async () => {
    // Cleanup: Delete test user if created
    if (testUserId) {
      try {
        await pool.request()
          .input('userId', testUserId)
          .query('DELETE FROM users WHERE id = @userId');
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }
    // Close connection pool
    await pool.close();
  });

  describe('registerUser', () => {
    it('should register a new user with PENDING status', async () => {
      const req = {
        body: {
          username: testUsername,
          email: testEmail,
          password: testPassword
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await registerUser(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration successful. Awaiting approval.'
      });

      // Verify user was created in database
      const result = await pool.request()
        .input('username', testUsername)
        .query('SELECT id, username, email, status_id FROM users WHERE username = @username');
      
      expect(result.recordset).toHaveLength(1);
      const user = result.recordset[0];
      expect(user.username).toBe(testUsername);
      expect(user.email).toBe(testEmail);
      
      // Get status name
      const statusResult = await pool.request()
        .input('statusId', user.status_id)
        .query('SELECT status FROM user_status WHERE id = @statusId');
      expect(statusResult.recordset[0].status).toBe('PENDING');

      // Store userId for cleanup
      testUserId = user.id;
    });

    it('should return 409 if username already exists', async () => {
      const req = {
        body: {
          username: testUsername,
          email: 'different@test.com',
          password: testPassword
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Username or email already exists.'
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          username: 'someuser'
          // missing email and password
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'All fields are required.'
      });
    });
  });

  describe('getUserStatus', () => {
    it('should return user status', async () => {
      const req = {
        query: { username: testUsername }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getUserStatus(req, res);

      expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        username: testUsername,
        email: testEmail,
        status: 'PENDING'
      }));
    });

    it('should return 404 if user not found', async () => {
      const req = {
        query: { username: 'nonexistentuser' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found.'
      });
    });
  });

  describe('loginUser', () => {
    it('should return 403 for PENDING user', async () => {
      const req = {
        body: {
          username: testUsername,
          password: testPassword
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account status: PENDING.'
      });
    });

    it('should return 401 for invalid password', async () => {
      const req = {
        body: {
          username: testUsername,
          password: 'WrongPassword123!'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials.'
      });
    });

    it('should return 401 for non-existent user', async () => {
      const req = {
        body: {
          username: 'nonexistentuser',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials.'
      });
    });

    it('should return token for approved user', async () => {
      // First, approve the user
      const approvedStatusResult = await pool.request()
        .input('status', 'APPROVED')
        .query('SELECT id FROM user_status WHERE status = @status');
      const approvedStatusId = approvedStatusResult.recordset[0].id;

      await pool.request()
        .input('userId', testUserId)
        .input('statusId', approvedStatusId)
        .query('UPDATE users SET status_id = @statusId WHERE id = @userId');

      // Now try to login
      const req = {
        body: {
          username: testUsername,
          password: testPassword
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      process.env.JWT_SECRET = 'testsecret';
      await loginUser(req, res);

      expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          username: testUsername,
          email: testEmail
        })
      );

      // Verify token is valid JWT
      const response = res.json.mock.calls[0][0];
      expect(response.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
    });

    it('should return 403 for rejected user', async () => {
      // Change user status to REJECTED
      const rejectedStatusResult = await pool.request()
        .input('status', 'REJECTED')
        .query('SELECT id FROM user_status WHERE status = @status');
      const rejectedStatusId = rejectedStatusResult.recordset[0].id;

      await pool.request()
        .input('userId', testUserId)
        .input('statusId', rejectedStatusId)
        .query('UPDATE users SET status_id = @statusId WHERE id = @userId');

      // Try to login
      const req = {
        body: {
          username: testUsername,
          password: testPassword
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account status: REJECTED.'
      });
    });
  });
});
