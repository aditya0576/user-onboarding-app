import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from '../AdminLogin';

describe('AdminLogin API integration', () => {
  it('shows success message on valid admin login', async () => {
    render(<AdminLogin />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'admin', name: 'username' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'adminpass', name: 'password' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Admin login successful/i)).toBeInTheDocument();
    });
  });

  it('shows error message on invalid admin credentials', async () => {
    render(<AdminLogin />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'wrong', name: 'username' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong', name: 'password' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Invalid admin credentials/i)).toBeInTheDocument();
    });
  });
});
