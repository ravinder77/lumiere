import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpError } from './http';
import { getAccessToken, getRefreshToken, setTokens } from './session';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('http client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('builds API URLs with query params and auth headers', async () => {
    setTokens('access-1', 'refresh-1');
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: true }));

    await http.get('/products', { params: { search: 'wallet', empty: '', page: 2 } });

    expect(fetch).toHaveBeenCalledWith(
      '/api/products?search=wallet&page=2',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.any(Headers),
      })
    );
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer access-1');
  });

  it('serializes JSON request bodies', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: true }));

    await http.post('/cart', { productId: '1' });

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.body).toBe(JSON.stringify({ productId: '1' }));
    expect((init?.headers as Headers).get('Content-Type')).toBe('application/json');
  });

  it('passes through FormData bodies and parses text responses', async () => {
    const formData = new FormData();
    formData.set('file', 'value');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const response = await http.patch<string>('/upload', formData);

    expect(response).toBe('ok');
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.body).toBe(formData);
    expect((init?.headers as Headers).get('Content-Type')).toBeNull();
  });

  it('throws HttpError for failed responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Nope' }, { status: 404 }));

    await expect(http.get('/missing')).rejects.toMatchObject({
      name: 'HttpError',
      status: 404,
      message: 'Nope',
    });
  });

  it('refreshes access tokens once and retries unauthorized requests', async () => {
    setTokens('expired-access', 'refresh-1');
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { accessToken: 'access-2', refreshToken: 'refresh-2' },
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true } }));

    const response = await http.get<{ success: boolean; data: { ok: boolean } }>('/auth/me');

    expect(response.data.ok).toBe(true);
    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-2');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(vi.mocked(fetch).mock.calls[1]?.[0]).toBe('/api/auth/refresh');
  });

  it('clears tokens when refresh fails', async () => {
    setTokens('expired-access', 'refresh-1');
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Invalid refresh' }, { status: 401 }));

    await expect(http.get('/auth/me')).rejects.toBeInstanceOf(HttpError);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('throws unauthorized when a refresh token is missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, { status: 401 }));

    await expect(http.get('/auth/me')).rejects.toMatchObject({ status: 401, message: 'Unauthorized' });
  });

  it('supports DELETE requests with bodies', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    await http.delete('/reviews/product-1', { body: { userId: 'user-1' } });

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.method).toBe('DELETE');
    expect(init?.body).toBe(JSON.stringify({ userId: 'user-1' }));
  });
});
