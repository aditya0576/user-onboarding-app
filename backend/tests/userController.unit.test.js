import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Create mock objects
const mockRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn()
};

const mockPool = {
  request: jest.fn(() => mockRequest)
};

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

// Import controllers AFTER mocking
import { getUserStatus, registerUser, loginUser } from '../src/controllers/userController.js';
import poolPromise from '../src/models/db.js';

// Get the mocked pool
let pool;
beforeAll(async () => {
  pool = await poolPromise;
});

describe('getUserStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if no username or email', async () => {
    const req = { query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUserStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username or email is required.' });
  });

  it('should return 404 if user not found', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [] }) };
    pool.request.mockReturnValueOnce(mockReq);
    
    const req = { query: { username: 'nouser' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUserStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('should return user status for valid user', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ username: 'user', email: 'user@x.com', status: 'APPROVED' }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    
    const req = { query: { username: 'user' } };
    const res = { json: jest.fn() };
    await getUserStatus(req, res);
    expect(res.json).toHaveBeenCalledWith({ username: 'user', email: 'user@x.com', status: 'APPROVED' });
  });
});

describe('registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if fields are missing', async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'All fields are required.' });
  });

  it('should return 409 if user exists', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1 }] }) };
    pool.request.mockReturnValue(mockReq);
    
    const req = { body: { username: 'test', email: 'test@test.com', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username or email already exists.' });
  });

  it('should return 201 for valid registration', async () => {
    const mockReq1 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [] }) };
    const mockReq2 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1 }] }) };
    const mockReq3 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ rowsAffected: [1] }) };
    
    pool.request
      .mockReturnValueOnce(mockReq1)
      .mockReturnValueOnce(mockReq2)
      .mockReturnValueOnce(mockReq3);
    
    const req = { body: { username: 'newuser', email: 'new@user.com', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Registration successful. Awaiting approval.' });
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if fields are missing', async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username and password are required.' });
  });

  it('should return 401 if user not found', async () => {
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [] }) };
    pool.request.mockReturnValueOnce(mockReq);
    
    const req = { body: { username: 'nouser', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
  });

  it('should return 401 if password does not match', async () => {
    const hashedPassword = await bcrypt.hash('wrong', 10);
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1, username: 'user', email: 'user@x.com', password_hash: hashedPassword, status: 'APPROVED' }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    
    const req = { body: { username: 'user', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
  });

  it('should return 403 if user not approved', async () => {
    const hashedPassword = await bcrypt.hash('pass', 10);
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1, username: 'user', email: 'user@x.com', password_hash: hashedPassword, status: 'PENDING' }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    
    const req = { body: { username: 'user', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Account status: PENDING.' });
  });

  it('should return token for valid login', async () => {
    const hashedPassword = await bcrypt.hash('pass', 10);
    const mockReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValueOnce({ recordset: [{ id: 1, username: 'user', email: 'user@x.com', password_hash: hashedPassword, status: 'APPROVED' }] }) };
    pool.request.mockReturnValueOnce(mockReq);
    
    const req = { body: { username: 'user', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    process.env.JWT_SECRET = 'testsecret';
    await loginUser(req, res);
    expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String), username: 'user', email: 'user@x.com' }));
  });
});

