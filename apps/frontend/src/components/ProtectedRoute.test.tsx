import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store/authStore';
import ProtectedRoute from './ProtectedRoute';

function renderProtected(adminOnly = false) {
  return render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route
          path="/account"
          element={<ProtectedRoute adminOnly={adminOnly}><div>Secret</div></ProtectedRoute>}
        />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      initialized: true,
      loading: false,
    });
  });

  it('redirects unauthenticated users to login', () => {
    renderProtected();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', name: 'User', email: 'u@example.com', role: 'CUSTOMER', createdAt: '' },
    });

    renderProtected();
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects non-admin users away from admin routes', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', name: 'User', email: 'u@example.com', role: 'CUSTOMER', createdAt: '' },
    });

    renderProtected(true);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('shows a loading spinner while auth is initializing', () => {
    useAuthStore.setState({ initialized: false });
    const { container } = renderProtected();

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
