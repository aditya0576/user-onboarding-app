import { render, screen, fireEvent } from '@testing-library/react';
import UserLogin from '../UserLogin';

describe('UserLogin', () => {
  it('renders login form', () => {
    render(<UserLogin />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    render(<UserLogin />);
    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });
});
