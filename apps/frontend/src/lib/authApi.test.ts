import { describe, expect, it, vi } from 'vitest';
import {
  changePasswordApi,
  getMeApi,
  getMyOrdersApi,
  loginApi,
  registerApi,
  updateProfileApi,
} from './authApi';
import { http } from '../shared/lib/http';

vi.mock('../shared/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('auth API wrappers', () => {
  it('calls auth endpoints with expected payloads', async () => {
    vi.mocked(http.post).mockResolvedValue({ success: true });
    vi.mocked(http.get).mockResolvedValue({ success: true });
    vi.mocked(http.patch).mockResolvedValue({ success: true });

    await registerApi({ name: 'Test User', email: 'test@example.com', password: 'Password1' });
    await loginApi({ email: 'test@example.com', password: 'Password1' });
    await getMeApi();
    await updateProfileApi({ name: 'Updated User' });
    await changePasswordApi({ currentPassword: 'Password1', newPassword: 'Newpass1' });
    await getMyOrdersApi();

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/auth/register',
      { name: 'Test User', email: 'test@example.com', password: 'Password1' },
      { retryOnAuthError: false }
    );
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      '/auth/login',
      { email: 'test@example.com', password: 'Password1' },
      { retryOnAuthError: false }
    );
    expect(http.get).toHaveBeenCalledWith('/auth/me');
    expect(http.patch).toHaveBeenCalledWith('/auth/profile', { name: 'Updated User' });
    expect(http.post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'Password1',
      newPassword: 'Newpass1',
    });
    expect(http.get).toHaveBeenCalledWith('/auth/orders');
  });
});
