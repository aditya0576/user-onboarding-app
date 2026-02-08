import { render, screen, fireEvent } from '@testing-library/react';
import UserStatus from '../UserStatus';

describe('UserStatus', () => {
  it('renders status check form', () => {
    render(<UserStatus />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByText('Check Status')).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    render(<UserStatus />);
    fireEvent.click(screen.getByText('Check Status'));
    expect(await screen.findByText(/User not found/i)).toBeInTheDocument();
  });
});
