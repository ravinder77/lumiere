import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { Server } from 'node:http';
import { createApp } from '../app/createApp';

describe('products API', () => {
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

  it('returns paginated products', async () => {
    const response = await fetch(`${baseUrl}/api/products?limit=2&page=1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 2);
    assert.equal(body.data.page, 1);
    assert.equal(body.data.limit, 2);
    assert.ok(body.data.total >= 2);
  });

  it('filters products by category and search term', async () => {
    const response = await fetch(`${baseUrl}/api/products?category=electronics&search=headphones`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].name, 'Noise-Cancelling Headphones');
  });

  it('returns 404 for an unknown product', async () => {
    const response = await fetch(`${baseUrl}/api/products/does-not-exist`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(body, { success: false, error: 'Product not found' });
  });
});
