const mockPrisma = {
  order: {
    findUnique: jest.fn(),
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

describe('orders API', () => {
  const app = createApp();
  const userToken = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'CUSTOMER' });
  const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects direct order creation', async () => {
    const response = await request(app).post('/api/orders').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('/api/checkout/session');
  });

  it('returns orders by authenticated owner, admin, or matching guest email', async () => {
    const order = {
      id: 'order-1',
      userId: 'user-1',
      customer: { email: 'guest@example.com' },
    };
    mockPrisma.order.findUnique.mockResolvedValue(order);

    const owner = await request(app).get('/api/orders/order-1').set('Authorization', `Bearer ${userToken}`);
    expect(owner.status).toBe(200);

    const admin = await request(app).get('/api/orders/order-1').set('Authorization', `Bearer ${adminToken}`);
    expect(admin.status).toBe(200);

    const guest = await request(app).get('/api/orders/order-1').query({ email: 'GUEST@example.com' });
    expect(guest.status).toBe(200);
  });

  it('hides orders from unauthorized callers and lists current-user orders', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      userId: 'someone-else',
      customer: { email: 'guest@example.com' },
    });

    const hidden = await request(app).get('/api/orders/order-1').set('Authorization', `Bearer ${userToken}`);
    expect(hidden.status).toBe(404);

    mockPrisma.order.findMany.mockResolvedValue([{ id: 'order-2' }]);
    const list = await request(app).get('/api/orders').set('Authorization', `Bearer ${userToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([{ id: 'order-2' }]);
  });
});
