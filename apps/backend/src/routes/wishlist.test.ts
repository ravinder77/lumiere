const mockPrisma = {
  wishlistItem: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import request from 'supertest';
import { createApp } from '../app/createApp';
import { signAccessToken } from '../lib/jwt';

describe('wishlist API', () => {
  const app = createApp();
  const token = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'CUSTOMER' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    await request(app).get('/api/wishlist').expect(401);
  });

  it('lists enriched wishlist items and ids', async () => {
    mockPrisma.wishlistItem.findMany
      .mockResolvedValueOnce([{ id: 'wish-1', userId: 'user-1', productId: '2', createdAt: new Date() }])
      .mockResolvedValueOnce([{ productId: '2' }]);

    const list = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data[0].product.name).toBe('Noise-Cancelling Headphones');

    const ids = await request(app).get('/api/wishlist/ids').set('Authorization', `Bearer ${token}`);
    expect(ids.status).toBe(200);
    expect(ids.body.data).toEqual(['2']);
  });

  it('adds and removes wishlist items', async () => {
    mockPrisma.wishlistItem.upsert.mockResolvedValue({
      id: 'wish-1',
      userId: 'user-1',
      productId: '2',
      createdAt: new Date(),
    });
    mockPrisma.wishlistItem.delete.mockResolvedValue({});

    const missingProductId = await request(app).post('/api/wishlist').set('Authorization', `Bearer ${token}`).send({});
    expect(missingProductId.status).toBe(400);

    const unknownProduct = await request(app)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'missing' });
    expect(unknownProduct.status).toBe(404);

    const add = await request(app)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: '2' });
    expect(add.status).toBe(201);
    expect(add.body.data.product.id).toBe('2');

    const remove = await request(app).delete('/api/wishlist/2').set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);
  });
});
