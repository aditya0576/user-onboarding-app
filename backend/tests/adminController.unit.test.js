// tests/adminController.unit.test.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the db module BEFORE importing controllers
jest.mock('../src/models/db.js', () => ({
  __esModule: true,
  default: Promise.resolve({
    request: jest.fn(() => ({
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    }))
  })
}));

// Import AFTER mocking
import { adminLogin, getPendingUsers, updateUserStatus } from '../src/controllers/adminController.js';
import poolPromise from '../src/models/db.js';

// Get the mocked pool
let pool;
beforeAll(async () => {
  pool = await poolPromise;
});

describe('adminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if fields are missing', async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await adminLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username and password are required.' });
  });

  it('should return 401 if admin not found', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [] }) };
    pool.request.mockReturnValueOnce(mockReq);
    const req = { body: { username: 'nouser', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await adminLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
  });

  it('should return 401 if password does not match', async () => {
    const hashedPassword = await bcrypt.hash('wrong', 10);
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1, username: 'admin', email: 'admin@x.com', password_hash: hashedPassword }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    const req = { body: { username: 'admin', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await adminLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
  });

  it('should return token for valid admin login', async () => {
    const hashedPassword = await bcrypt.hash('pass', 10);
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1, username: 'admin', email: 'admin@x.com', password_hash: hashedPassword }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    const req = { body: { username: 'admin', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    process.env.JWT_SECRET = 'testsecret';
    await adminLogin(req, res);
    expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String), username: 'admin', email: 'admin@x.com' }));
  });
});

describe('getPendingUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return pending users', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1, username: 'user', email: 'user@x.com', status: 'PENDING', created_at: '2026-02-07' }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    const req = {};
    const res = { json: jest.fn() };
    await getPendingUsers(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, username: 'user', email: 'user@x.com', status: 'PENDING', created_at: '2026-02-07' }]);
  });
});

describe('updateUserStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid action', async () => {
    const req = { params: { userId: 1 }, body: { action: 'INVALID' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateUserStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid action.' });
  });

  it('should return 400 if status not found', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [] }) };
    pool.request.mockReturnValueOnce(mockReq);
    const req = { params: { userId: 1 }, body: { action: 'APPROVE' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateUserStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Status not found.' });
  });

  it('should return 404 if user not found', async () => {
    const mockReq1 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 2 }] }) };
    const mockReq2 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ rowsAffected: [0] }) };
    pool.request
      .mockReturnValueOnce(mockReq1) // status_id
      .mockReturnValueOnce(mockReq2); // update
    const req = { params: { userId: 1 }, body: { action: 'APPROVE' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateUserStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('should approve user successfully', async () => {
    const mockReq1 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 2 }] }) };
    const mockReq2 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ rowsAffected: [1] }) };
    pool.request
      .mockReturnValueOnce(mockReq1) // status_id
      .mockReturnValueOnce(mockReq2); // update
    const req = { params: { userId: 1 }, body: { action: 'APPROVE' } };
    const res = { json: jest.fn() };
    await updateUserStatus(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'User approved.' });
  });

  it('should reject user successfully', async () => {
    const mockReq1 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 3 }] }) };
    const mockReq2 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ rowsAffected: [1] }) };
    pool.request
      .mockReturnValueOnce(mockReq1) // status_id
      .mockReturnValueOnce(mockReq2); // update
    const req = { params: { userId: 1 }, body: { action: 'REJECT' } };
    const res = { json: jest.fn() };
    await updateUserStatus(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'User rejected.' });
  });
});
