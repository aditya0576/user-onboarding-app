import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserStatus from '../UserStatus';

describe('UserStatus API integration', () => {
  it('shows status for known user', async () => {
    render(<UserStatus />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser', name: 'username' } });
    fireEvent.click(screen.getByText('Check Status'));
    await waitFor(() => {
      expect(screen.getByText(/PENDING/i)).toBeInTheDocument();
    });
  });

  it('shows error for unknown user', async () => {
    render(<UserStatus />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'unknown', name: 'username' } });
    fireEvent.click(screen.getByText('Check Status'));
    await waitFor(() => {
      expect(screen.getByText(/User not found/i)).toBeInTheDocument();
    });
  });
});
