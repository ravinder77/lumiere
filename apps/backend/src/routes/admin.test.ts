const mockPrisma = {
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  order: {
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import request from 'supertest';
import { createApp } from '../app/createApp';
import { signAccessToken } from '../lib/jwt';

describe('admin API', () => {
  const app = createApp();
  const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });
  const userToken = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'CUSTOMER' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires admin access', async () => {
    await request(app).get('/api/admin/stats').expect(401);
    await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${userToken}`).expect(403);
  });

  it('returns dashboard stats', async () => {
    mockPrisma.user.count.mockResolvedValue(2);
    mockPrisma.order.count.mockResolvedValue(2);
    mockPrisma.order.findMany.mockResolvedValue([
      { total: 10, status: 'PENDING', createdAt: new Date() },
      { total: 25.55, status: 'PROCESSING', createdAt: new Date() },
    ]);

    const response = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.users.total).toBe(2);
    expect(response.body.data.orders.pending).toBe(1);
    expect(response.body.data.revenue.total).toBe(35.55);
  });

  it('lists users and updates admin resources', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-1', email: 'user@example.com' }]);
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    mockPrisma.order.findMany.mockResolvedValue([{ id: 'order-1' }]);
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'SHIPPED' });

    const users = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(users.status).toBe(200);
    expect(users.body.data).toHaveLength(1);

    const role = await request(app)
      .patch('/api/admin/users/user-1/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });
    expect(role.status).toBe(200);

    const orders = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(orders.status).toBe(200);

    const status = await request(app)
      .patch('/api/admin/orders/order-1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SHIPPED' });
    expect(status.status).toBe(200);
  });

  it('rejects invalid updates', async () => {
    const invalidRole = await request(app)
      .patch('/api/admin/users/user-1/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ROOT' });
    expect(invalidRole.status).toBe(400);

    const invalidStatus = await request(app)
      .patch('/api/admin/orders/order-1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LOST' });
    expect(invalidStatus.status).toBe(400);
  });
});
