import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './session';

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: BodyInit | object | null;
  headers?: HeadersInit;
  params?: object;
  retryOnAuthError?: boolean;
}

class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

let refreshPromise: Promise<string> | null = null;

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

function buildUrl(path: string, params?: object): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const resolvedBaseUrl = new URL(apiBaseUrl || '/api', window.location.origin).toString().replace(/\/+$/, '');
  const url = new URL(`${resolvedBaseUrl}${normalizedPath}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    const queryValue = value as QueryValue;
    if (queryValue === undefined || queryValue === null || queryValue === '') return;
    url.searchParams.set(key, String(queryValue));
  });

  return url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.toString();
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  if (!refreshPromise) {
    refreshPromise = request<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: { refreshToken },
        retryOnAuthError: false,
      }
    )
      .then((result) => {
        const nextAccessToken = result.data.accessToken;
        const nextRefreshToken = result.data.refreshToken;
        setTokens(nextAccessToken, nextRefreshToken);
        return nextAccessToken;
      })
      .catch((error) => {
        clearTokens();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    headers,
    params,
    retryOnAuthError = true,
    ...init
  } = options;

  const requestHeaders = new Headers(headers);
  const accessToken = getAccessToken();
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  let requestBody: BodyInit | null | undefined = body as BodyInit | null | undefined;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), {
    ...init,
    body: requestBody,
    credentials: 'include',
    headers: requestHeaders,
  });

  const data = await parseResponse(response);

  if (response.status === 401 && retryOnAuthError && path !== '/auth/refresh') {
    try {
      const nextAccessToken = await refreshAccessToken();
      requestHeaders.set('Authorization', `Bearer ${nextAccessToken}`);

      const retryResponse = await fetch(buildUrl(path, params), {
        ...init,
        body: requestBody,
        credentials: 'include',
        headers: requestHeaders,
      });

      const retryData = await parseResponse(retryResponse);
      if (!retryResponse.ok) {
        throw new HttpError(
          retryResponse.status,
          (retryData as { error?: string } | null)?.error ?? 'Request failed',
          retryData
        );
      }

      return retryData as T;
    } catch {
      throw new HttpError(response.status, 'Unauthorized', data);
    }
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      (data as { error?: string } | null)?.error ?? 'Request failed',
      data
    );
  }

  return data as T;
}

export const http = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};

export { HttpError };
