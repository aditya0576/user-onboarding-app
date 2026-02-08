import { rest } from 'msw';

export const handlers = [
  // User Register
  rest.post('http://localhost:5000/api/users/register', (req, res, ctx) => {
    const { username, email, password } = req.body;
    if (username && email && password) {
      return res(ctx.status(200), ctx.json({ message: 'Registration successful!' }));
    }
    return res(ctx.status(400), ctx.json({ error: 'All fields are required' }));
  }),

  // User Login
  rest.post('http://localhost:5000/api/users/login', (req, res, ctx) => {
    const { username, password } = req.body;
    if (username === 'testuser' && password === 'password123') {
      return res(ctx.status(200), ctx.json({ token: 'fake-jwt-token' }));
    }
    return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
  }),

  // User Status
  rest.get('http://localhost:5000/api/users/status', (req, res, ctx) => {
    const username = req.url.searchParams.get('username');
    const email = req.url.searchParams.get('email');
    if (username === 'testuser' || email === 'test@example.com') {
      return res(ctx.status(200), ctx.json({ status: 'PENDING' }));
    }
    return res(ctx.status(404), ctx.json({ error: 'User not found' }));
  }),

  // Admin Login
  rest.post('http://localhost:5000/api/admin/login', (req, res, ctx) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'adminpass') {
      return res(ctx.status(200), ctx.json({ token: 'admin-jwt-token' }));
    }
    return res(ctx.status(401), ctx.json({ error: 'Invalid admin credentials' }));
  }),

  // Admin Pending Users
  rest.get('http://localhost:5000/api/admin/pending-users', (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    if (auth === 'Bearer admin-jwt-token') {
      return res(ctx.status(200), ctx.json([
        { id: 1, username: 'testuser', email: 'test@example.com', status: 'PENDING' }
      ]));
    }
    return res(ctx.status(403), ctx.json({ error: 'Unauthorized' }));
  }),

  // Admin Approve/Reject
  rest.patch('http://localhost:5000/api/admin/user/:userId/status', (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    const { action } = req.body;
    if (auth === 'Bearer admin-jwt-token') {
      if (action === 'APPROVE') {
        return res(ctx.status(200), ctx.json({ message: 'User approved' }));
      } else if (action === 'REJECT') {
        return res(ctx.status(200), ctx.json({ message: 'User rejected' }));
      }
      return res(ctx.status(400), ctx.json({ error: 'Invalid action' }));
    }
    return res(ctx.status(403), ctx.json({ error: 'Unauthorized' }));
  })
];
