import request from 'supertest';
import { createApp } from '../app/createApp';

describe('metrics and base app behavior', () => {
  const app = createApp();

  it('exposes health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('returns JSON 404s for unknown routes', async () => {
    const response = await request(app).get('/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, error: 'Route not found' });
  });
});
