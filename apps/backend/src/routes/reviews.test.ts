const mockPrisma = {
  productReview: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import request from 'supertest';
import { createApp } from '../app/createApp';
import { signAccessToken } from '../lib/jwt';

describe('reviews API', () => {
  const app = createApp();
  const token = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'CUSTOMER' });
  const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists product reviews with stats', async () => {
    mockPrisma.productReview.findMany.mockResolvedValue([
      { id: 'review-1', rating: 5, title: 'Great', body: 'Very good product', user: { id: 'user-1', name: 'User' } },
      { id: 'review-2', rating: 3, title: 'Okay', body: 'It is acceptable', user: { id: 'user-2', name: 'Other' } },
    ]);

    const response = await request(app).get('/api/reviews/2');

    expect(response.status).toBe(200);
    expect(response.body.data.stats.count).toBe(2);
    expect(response.body.data.stats.average).toBe(4);
    expect(response.body.data.stats.distribution[0]).toEqual({ star: 5, count: 1 });
  });

  it('returns 404 for reviews on unknown products', async () => {
    await request(app).get('/api/reviews/missing').expect(404);
  });

  it('creates verified reviews for purchased products', async () => {
    mockPrisma.order.findMany.mockResolvedValue([{ items: [{ productId: '2' }] }]);
    mockPrisma.productReview.upsert.mockResolvedValue({
      id: 'review-1',
      productId: '2',
      rating: 5,
      title: 'Excellent',
      body: 'A really good product',
      verified: true,
    });

    const response = await request(app)
      .post('/api/reviews/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, title: 'Excellent', body: 'A really good product' });

    expect(response.status).toBe(201);
    expect(mockPrisma.productReview.upsert.mock.calls[0][0].create.verified).toBe(true);
  });

  it('validates review creation and empty updates', async () => {
    const unauthenticated = await request(app).post('/api/reviews/2').send({});
    expect(unauthenticated.status).toBe(401);

    const invalid = await request(app)
      .post('/api/reviews/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 10, title: 'No', body: 'short' });
    expect(invalid.status).toBe(422);

    const emptyUpdate = await request(app).patch('/api/reviews/2').set('Authorization', `Bearer ${token}`).send({});
    expect(emptyUpdate.status).toBe(422);
  });

  it('updates and deletes reviews', async () => {
    mockPrisma.productReview.update.mockResolvedValue({ id: 'review-1', title: 'Updated' });
    mockPrisma.productReview.delete.mockResolvedValue({});

    const update = await request(app)
      .patch('/api/reviews/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated' });
    expect(update.status).toBe(200);

    const removeOwn = await request(app).delete('/api/reviews/2').set('Authorization', `Bearer ${token}`);
    expect(removeOwn.status).toBe(200);

    const removeAsAdmin = await request(app)
      .delete('/api/reviews/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'user-2' });
    expect(removeAsAdmin.status).toBe(200);
    expect(mockPrisma.productReview.delete.mock.calls[1][0].where.userId_productId.userId).toBe('user-2');
  });
});
