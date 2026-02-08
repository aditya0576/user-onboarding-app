import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPendingUsers from '../AdminPendingUsers';

describe('AdminPendingUsers API integration', () => {
  it('shows pending users with valid token', async () => {
    render(<AdminPendingUsers />);
    fireEvent.change(screen.getByPlaceholderText('Admin JWT Token'), { target: { value: 'admin-jwt-token' } });
    fireEvent.click(screen.getByText('Fetch Pending Users'));
    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      expect(screen.getByText(/Approve/i)).toBeInTheDocument();
      expect(screen.getByText(/Reject/i)).toBeInTheDocument();
    });
  });

  it('shows error with invalid token', async () => {
    render(<AdminPendingUsers />);
    fireEvent.change(screen.getByPlaceholderText('Admin JWT Token'), { target: { value: 'bad-token' } });
    fireEvent.click(screen.getByText('Fetch Pending Users'));
    await waitFor(() => {
      expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
    });
  });

  it('can approve a user', async () => {
    render(<AdminPendingUsers />);
    fireEvent.change(screen.getByPlaceholderText('Admin JWT Token'), { target: { value: 'admin-jwt-token' } });
    fireEvent.click(screen.getByText('Fetch Pending Users'));
    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => {
      expect(screen.getByText(/User approved/i)).toBeInTheDocument();
    });
  });

  it('can reject a user', async () => {
    render(<AdminPendingUsers />);
    fireEvent.change(screen.getByPlaceholderText('Admin JWT Token'), { target: { value: 'admin-jwt-token' } });
    fireEvent.click(screen.getByText('Fetch Pending Users'));
    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => {
      expect(screen.getByText(/User rejected/i)).toBeInTheDocument();
    });
  });
});
