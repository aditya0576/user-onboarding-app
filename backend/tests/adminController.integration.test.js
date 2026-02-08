import { adminLogin, getPendingUsers, updateUserStatus } from '../src/controllers/adminController.js';
import poolPromise from '../src/models/db.js';
import bcrypt from 'bcrypt';

describe('Admin Controller Integration Tests (Real Azure SQL Database)', () => {
  let pool;
  const testAdminUsername = `testadmin_${Date.now()}`;
  const testAdminEmail = `testadmin_${Date.now()}@test.com`;
  const testAdminPassword = 'AdminPassword123!';
  let testAdminId;
  
  const testUsername = `integrationuser_${Date.now()}`;
  const testEmail = `integrationuser_${Date.now()}@test.com`;
  let testUserId;
  let pendingStatusId;
  let approvedStatusId;
  let rejectedStatusId;

  beforeAll(async () => {
    pool = await poolPromise;

    // Get status IDs
    const statusResult = await pool.request().query('SELECT id, status FROM user_status');
    pendingStatusId = statusResult.recordset.find(s => s.status === 'PENDING').id;
    approvedStatusId = statusResult.recordset.find(s => s.status === 'APPROVED').id;
    rejectedStatusId = statusResult.recordset.find(s => s.status === 'REJECTED').id;

    // Create test admin
    const hashedPassword = await bcrypt.hash(testAdminPassword, 10);
    const adminResult = await pool.request()
      .input('username', testAdminUsername)
      .input('email', testAdminEmail)
      .input('password', hashedPassword)
      .query('INSERT INTO admins (username, email, password_hash) OUTPUT INSERTED.id VALUES (@username, @email, @password)');
    testAdminId = adminResult.recordset[0].id;

    // Create test user with PENDING status
    const userPassword = await bcrypt.hash('UserPassword123!', 10);
    const userResult = await pool.request()
      .input('username', testUsername)
      .input('email', testEmail)
      .input('password', userPassword)
      .input('statusId', pendingStatusId)
      .query('INSERT INTO users (username, email, password_hash, status_id) OUTPUT INSERTED.id VALUES (@username, @email, @password, @statusId)');
    testUserId = userResult.recordset[0].id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    try {
      if (testUserId) {
        await pool.request()
          .input('userId', testUserId)
          .query('DELETE FROM users WHERE id = @userId');
      }
      if (testAdminId) {
        await pool.request()
          .input('adminId', testAdminId)
          .query('DELETE FROM admins WHERE id = @adminId');
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
    // Close connection pool
    await pool.close();
  });

  describe('adminLogin', () => {
    it('should return token for valid admin credentials', async () => {
      const req = {
        body: {
          username: testAdminUsername,
          password: testAdminPassword
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      process.env.JWT_SECRET = 'testsecret';
      await adminLogin(req, res);

      expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          username: testAdminUsername,
          email: testAdminEmail
        })
      );

      // Verify token is valid JWT
      const response = res.json.mock.calls[0][0];
      expect(response.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    it('should return 401 for invalid password', async () => {
      const req = {
        body: {
          username: testAdminUsername,
          password: 'WrongPassword123!'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials.'
      });
    });

    it('should return 401 for non-existent admin', async () => {
      const req = {
        body: {
          username: 'nonexistentadmin',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials.'
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          username: testAdminUsername
          // missing password
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Username and password are required.'
      });
    });
  });

  describe('getPendingUsers', () => {
    it('should return list of pending users including test user', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getPendingUsers(req, res);

      expect(res.json).toHaveBeenCalled();
      const pendingUsers = res.json.mock.calls[0][0];
      expect(Array.isArray(pendingUsers)).toBe(true);
      
      // Find our test user
      const testUser = pendingUsers.find(u => u.username === testUsername);
      expect(testUser).toBeDefined();
      expect(testUser.email).toBe(testEmail);
      expect(testUser.status).toBe('PENDING');
      expect(testUser.id).toBe(testUserId);
    });
  });

  describe('updateUserStatus', () => {
    it('should approve user successfully', async () => {
      const req = {
        params: { userId: testUserId.toString() },
        body: { action: 'APPROVE' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateUserStatus(req, res);

      expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
      expect(res.json).toHaveBeenCalledWith({
        message: 'User approved.'
      });

      // Verify user status in database
      const result = await pool.request()
        .input('userId', testUserId)
        .query(`
          SELECT u.status_id, s.status 
          FROM users u 
          JOIN user_status s ON u.status_id = s.id 
          WHERE u.id = @userId
        `);
      expect(result.recordset[0].status).toBe('APPROVED');
    });

    it('should reject user successfully', async () => {
      const req = {
        params: { userId: testUserId.toString() },
        body: { action: 'REJECT' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateUserStatus(req, res);

      expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
      expect(res.json).toHaveBeenCalledWith({
        message: 'User rejected.'
      });

      // Verify user status in database
      const result = await pool.request()
        .input('userId', testUserId)
        .query(`
          SELECT u.status_id, s.status 
          FROM users u 
          JOIN user_status s ON u.status_id = s.id 
          WHERE u.id = @userId
        `);
      expect(result.recordset[0].status).toBe('REJECTED');
    });

    it('should return 400 for invalid action', async () => {
      const req = {
        params: { userId: testUserId.toString() },
        body: { action: 'INVALID_ACTION' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid action.'
      });
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: '999999' },
        body: { action: 'APPROVE' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found.'
      });
    });
  });
});
