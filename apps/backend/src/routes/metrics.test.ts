import request from 'supertest';
import { createApp } from '../app/createApp';

describe('metrics and base app behavior', () => {
  const app = createApp();

  it('exposes health and Prometheus metrics', async () => {
    await request(app).get('/health').expect(200);

    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('lumiere_backend_http_requests_total');
    expect(response.text).toContain('route="/health"');
  });

  it('returns JSON 404s for unknown routes', async () => {
    const response = await request(app).get('/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, error: 'Route not found' });
  });
});
