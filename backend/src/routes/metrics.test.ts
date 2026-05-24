import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { Server } from 'node:http';
import { createApp } from '../app/createApp';

describe('metrics endpoint', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        assert(address && typeof address === 'object');
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  it('exposes Prometheus metrics for the backend', async () => {
    await fetch(`${baseUrl}/health`);

    const response = await fetch(`${baseUrl}/metrics`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
    assert.match(body, /lumiere_backend_http_requests_total/);
    assert.match(body, /lumiere_backend_http_request_duration_seconds_bucket/);
    assert.match(body, /route="\/health"/);
  });
});
