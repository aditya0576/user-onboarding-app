import { render, screen, fireEvent } from '@testing-library/react';
import AdminLogin from '../AdminLogin';

describe('AdminLogin', () => {
  it('renders admin login form', () => {
    render(<AdminLogin />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    render(<AdminLogin />);
    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByText(/Invalid admin credentials/i)).toBeInTheDocument();
  });
});
