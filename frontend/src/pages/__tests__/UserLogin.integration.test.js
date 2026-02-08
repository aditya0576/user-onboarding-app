import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserLogin from '../UserLogin';

describe('UserLogin API integration', () => {
  it('shows success message on valid login', async () => {
    render(<UserLogin />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser', name: 'username' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123', name: 'password' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
    });
  });

  it('shows error message on invalid credentials', async () => {
    render(<UserLogin />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'wrong', name: 'username' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong', name: 'password' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
