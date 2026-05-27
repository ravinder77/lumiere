import { AuthResponse, RegisterPayload, LoginPayload, User } from '../types/auth';
import { Order } from '../types';
import { http } from '../shared/lib/http';
import { clearTokens, getAccessToken, setTokens } from '../shared/lib/session';

// ── Auth endpoints ────────────────────────────────────────────────────────────

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  return http.post<AuthResponse>('/auth/register', payload, { retryOnAuthError: false });
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  return http.post<AuthResponse>('/auth/login', payload, { retryOnAuthError: false });
}

export async function getMeApi(): Promise<{ success: boolean; data: { user: User } }> {
  return http.get('/auth/me');
}

export async function updateProfileApi(
  payload: Partial<{ name: string; email: string }>
): Promise<{ success: boolean; data: { user: User }; message?: string }> {
  return http.patch('/auth/profile', payload);
}

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  return http.post('/auth/change-password', payload);
}

export async function getMyOrdersApi(): Promise<{ success: boolean; data: Order[] }> {
  return http.get('/auth/orders');
}
export { clearTokens, getAccessToken, setTokens };
