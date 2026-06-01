import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, getAccessToken, setTokens } from '../shared/lib/session';
import {
  changePasswordApi,
  getMeApi,
  loginApi,
  registerApi,
  updateProfileApi,
} from '../lib/authApi';
import { useAuthStore } from './authStore';
import type { User } from '../types/auth';

vi.mock('../lib/authApi', async () => {
  const session = await vi.importActual<typeof import('../shared/lib/session')>('../shared/lib/session');
  return {
    loginApi: vi.fn(),
    registerApi: vi.fn(),
    getMeApi: vi.fn(),
    updateProfileApi: vi.fn(),
    changePasswordApi: vi.fn(),
    setTokens: session.setTokens,
    clearTokens: session.clearTokens,
    getAccessToken: session.getAccessToken,
  };
});

const user: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('authStore', () => {
  beforeEach(() => {
    clearTokens();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      initialized: false,
    });
  });

  it('logs in and stores tokens', async () => {
    vi.mocked(loginApi).mockResolvedValue({
      success: true,
      data: { user, accessToken: 'access-1', refreshToken: 'refresh-1' },
    });

    await useAuthStore.getState().login('test@example.com', 'Password1');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(getAccessToken()).toBe('access-1');
  });

  it('resets loading and throws for failed login responses', async () => {
    vi.mocked(loginApi).mockResolvedValue({ success: false, error: 'Invalid', data: undefined as never });

    await expect(useAuthStore.getState().login('test@example.com', 'bad')).rejects.toThrow('Invalid');
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('registers and logs the new user in', async () => {
    vi.mocked(registerApi).mockResolvedValue({
      success: true,
      data: { user, accessToken: 'access-2', refreshToken: 'refresh-2' },
    });

    await useAuthStore.getState().register('Test User', 'test@example.com', 'Password1');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getAccessToken()).toBe('access-2');
  });

  it('throws for failed registration responses', async () => {
    vi.mocked(registerApi).mockResolvedValue({ success: false, error: 'Taken', data: undefined as never });

    await expect(useAuthStore.getState().register('Test User', 'test@example.com', 'Password1')).rejects.toThrow('Taken');
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('logs out and clears tokens', () => {
    setTokens('access-1', 'refresh-1');
    useAuthStore.setState({ user, isAuthenticated: true });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it('marks fetchMe initialized when the API returns success false', async () => {
    setTokens('access-1', 'refresh-1');
    vi.mocked(getMeApi).mockResolvedValue({ success: false, data: undefined as never });

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState().initialized).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('fetches the current user when a token exists', async () => {
    setTokens('access-1', 'refresh-1');
    vi.mocked(getMeApi).mockResolvedValue({ success: true, data: { user } });

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState()).toMatchObject({
      initialized: true,
      isAuthenticated: true,
      user,
    });
  });

  it('clears auth state when no token exists or fetchMe fails', async () => {
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState().initialized).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    setTokens('access-1', 'refresh-1');
    useAuthStore.setState({ isAuthenticated: true, user, initialized: false });
    vi.mocked(getMeApi).mockRejectedValue(new Error('expired'));

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it('updates profile data and throws on unsuccessful API responses', async () => {
    vi.mocked(updateProfileApi).mockResolvedValueOnce({
      success: true,
      data: { user: { ...user, name: 'Updated User' } },
    });

    await useAuthStore.getState().updateProfile({ name: 'Updated User' });
    expect(useAuthStore.getState().user?.name).toBe('Updated User');

    vi.mocked(updateProfileApi).mockResolvedValueOnce({
      success: false,
      data: undefined as never,
      message: 'Could not update',
    });

    await expect(useAuthStore.getState().updateProfile({ name: 'Broken' })).rejects.toThrow('Could not update');
  });

  it('changes passwords and surfaces failures', async () => {
    vi.mocked(changePasswordApi).mockResolvedValueOnce({ success: true });
    await expect(useAuthStore.getState().changePassword('Password1', 'Newpass1')).resolves.toBeUndefined();

    vi.mocked(changePasswordApi).mockResolvedValueOnce({ success: false, error: 'Bad password' });
    await expect(useAuthStore.getState().changePassword('bad', 'Newpass1')).rejects.toThrow('Bad password');
  });
});
