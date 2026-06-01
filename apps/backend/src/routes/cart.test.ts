import request from 'supertest';
import { createApp } from '../app/createApp';

describe('cart API', () => {
  const app = createApp();

  async function createCart() {
    const response = await request(app).post('/api/cart');
    expect(response.status).toBe(201);
    return response.body.data as { id: string };
  }

  it('creates and reads an empty cart', async () => {
    const cart = await createCart();
    const response = await request(app).get(`/api/cart/${cart.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: cart.id, itemCount: 0, total: 0 });
  });

  it('rejects invalid cart item creation input', async () => {
    const cart = await createCart();
    const response = await request(app)
      .post(`/api/cart/${cart.id}/items`)
      .send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, error: 'productId is required' });
  });

  it('adds, updates, removes, and clears cart items', async () => {
    const cart = await createCart();

    const add = await request(app)
      .post(`/api/cart/${cart.id}/items`)
      .send({ productId: '2', quantity: 2 });
    expect(add.status).toBe(200);
    expect(add.body.data.itemCount).toBe(2);

    const update = await request(app)
      .patch(`/api/cart/${cart.id}/items/2`)
      .send({ quantity: 3 });
    expect(update.status).toBe(200);
    expect(update.body.data.itemCount).toBe(3);

    const removeViaQuantity = await request(app)
      .patch(`/api/cart/${cart.id}/items/2`)
      .send({ quantity: 0 });
    expect(removeViaQuantity.status).toBe(200);
    expect(removeViaQuantity.body.data.itemCount).toBe(0);

    await request(app)
      .post(`/api/cart/${cart.id}/items`)
      .send({ productId: '2', quantity: 1 })
      .expect(200);

    const remove = await request(app).delete(`/api/cart/${cart.id}/items/2`);
    expect(remove.status).toBe(200);
    expect(remove.body.data.itemCount).toBe(0);

    const clear = await request(app).delete(`/api/cart/${cart.id}`);
    expect(clear.status).toBe(200);
    expect(clear.body.message).toBe('Cart cleared');

    const missing = await request(app).get(`/api/cart/${cart.id}`);
    expect(missing.status).toBe(404);
  });

  it('returns useful validation and not-found responses', async () => {
    const cart = await createCart();

    await expect(request(app).post('/api/cart/missing/items').send({ productId: '1', quantity: 1 }))
      .resolves.toMatchObject({ status: 404 });
    await expect(request(app).post(`/api/cart/${cart.id}/items`).send({ productId: 'missing', quantity: 1 }))
      .resolves.toMatchObject({ status: 404 });
    await expect(request(app).post(`/api/cart/${cart.id}/items`).send({ productId: '1', quantity: 0 }))
      .resolves.toMatchObject({ status: 422 });
    await expect(request(app).patch(`/api/cart/${cart.id}/items/1`).send({ quantity: 1 }))
      .resolves.toMatchObject({ status: 404 });
    await expect(request(app).patch(`/api/cart/${cart.id}/items/1`).send({ quantity: -1 }))
      .resolves.toMatchObject({ status: 404 });
    await expect(request(app).delete('/api/cart/missing/items/1'))
      .resolves.toMatchObject({ status: 404 });
  });
});
