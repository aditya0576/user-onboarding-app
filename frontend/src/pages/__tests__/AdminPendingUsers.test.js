import { render, screen, fireEvent } from '@testing-library/react';
import AdminPendingUsers from '../AdminPendingUsers';

describe('AdminPendingUsers', () => {
  it('renders pending users UI', () => {
    render(<AdminPendingUsers />);
    expect(screen.getByPlaceholderText('Admin JWT Token')).toBeInTheDocument();
    expect(screen.getByText('Fetch Pending Users')).toBeInTheDocument();
  });
});
