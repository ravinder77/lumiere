import { describe, expect, it } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './session';

describe('session token storage', () => {
  it('sets, reads, and clears auth tokens', () => {
    setTokens('access-token', 'refresh-token');

    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');

    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
