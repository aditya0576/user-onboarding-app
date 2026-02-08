import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserRegister from '../UserRegister';

describe('UserRegister API integration', () => {
  it('shows success message on valid registration', async () => {
    render(<UserRegister />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser', name: 'username' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com', name: 'email' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123', name: 'password' } });
    fireEvent.click(screen.getByText('Register'));
    await waitFor(() => {
      expect(screen.getByText(/Registration successful/i)).toBeInTheDocument();
    });
  });

  it('shows error message on missing fields', async () => {
    render(<UserRegister />);
    fireEvent.click(screen.getByText('Register'));
    await waitFor(() => {
      expect(screen.getByText(/All fields are required/i)).toBeInTheDocument();
    });
  });
});
