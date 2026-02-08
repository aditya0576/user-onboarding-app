import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders navigation links', () => {
    render(<App />);
    expect(screen.getByText('User Register')).toBeInTheDocument();
    expect(screen.getByText('User Login')).toBeInTheDocument();
    expect(screen.getByText('User Status')).toBeInTheDocument();
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByText('Admin Pending Users')).toBeInTheDocument();
  });
});
