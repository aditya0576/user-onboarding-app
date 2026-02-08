import { render, screen, fireEvent } from '@testing-library/react';
import UserRegister from '../UserRegister';

describe('UserRegister', () => {
  it('renders registration form', () => {
    render(<UserRegister />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    render(<UserRegister />);
    fireEvent.click(screen.getByText('Register'));
    expect(await screen.findByText(/Registration failed|All fields are required/i)).toBeInTheDocument();
  });
});
