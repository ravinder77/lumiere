const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../app/createApp';
import { signAccessToken, signRefreshToken } from '../lib/jwt';

describe('auth API', () => {
  const app = createApp();
  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and returns tokens', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(async ({ data }) => ({
      id: 'user-1',
      email: data.email,
      name: data.name,
      role: 'CUSTOMER',
      createdAt,
    }));

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'TEST@Example.com', password: 'Password1' });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(mockPrisma.user.create.mock.calls[0][0].data.passwordHash).toEqual(expect.any(String));
  });

  it('rejects duplicate registration and invalid login payloads', async () => {
    const invalid = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expect(invalid.status).toBe(422);

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'Password1' });
    expect(duplicate.status).toBe(409);

    const login = await request(app).post('/api/auth/login').send({ email: 'bad' });
    expect(login.status).toBe(422);
  });

  it('logs in and refreshes tokens', async () => {
    const passwordHash = await bcrypt.hash('Password1', 4);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
      passwordHash,
      createdAt,
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe('test@example.com');

    const refreshToken = signRefreshToken({ userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER' });
    const refresh = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects invalid login and refresh attempts', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const missingUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'Password1' });
    expect(missingUser.status).toBe(401);

    const passwordHash = await bcrypt.hash('Password1', 4);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
      passwordHash,
      createdAt,
    });
    const badPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Wrongpass1' });
    expect(badPassword.status).toBe(401);

    const missingToken = await request(app).post('/api/auth/refresh').send({});
    expect(missingToken.status).toBe(422);

    const invalidToken = await request(app).post('/api/auth/refresh').send({ refreshToken: 'not-a-token' });
    expect(invalidToken.status).toBe(401);

    const refreshToken = signRefreshToken({ userId: 'missing', email: 'missing@example.com', role: 'CUSTOMER' });
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const missingRefreshUser = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(missingRefreshUser.status).toBe(401);
  });

  it('protects account routes and returns the current user', async () => {
    const noToken = await request(app).get('/api/auth/me');
    expect(noToken.status).toBe(401);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
      createdAt,
    });

    const token = signAccessToken({ userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER' });
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe('user-1');

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const missing = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it('updates profiles, changes passwords, and lists authenticated orders', async () => {
    const token = signAccessToken({ userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER' });
    const passwordHash = await bcrypt.hash('Password1', 4);

    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      name: 'New Name',
      role: 'CUSTOMER',
      createdAt,
    });

    const profile = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', email: 'new@example.com' });
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.email).toBe('new@example.com');

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash });
    const password = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1', newPassword: 'Newpass1' });
    expect(password.status).toBe(200);

    mockPrisma.order.findMany.mockResolvedValue([{ id: 'order-1' }]);
    const orders = await request(app).get('/api/auth/orders').set('Authorization', `Bearer ${token}`);
    expect(orders.status).toBe(200);
    expect(orders.body.data).toEqual([{ id: 'order-1' }]);
  });

  it('returns validation and conflict responses for profile and password changes', async () => {
    const token = signAccessToken({ userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER' });

    const invalidProfile = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' });
    expect(invalidProfile.status).toBe(422);

    mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'other-user' });
    const conflict = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'taken@example.com' });
    expect(conflict.status).toBe(409);

    const invalidPassword = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: '', newPassword: 'short' });
    expect(invalidPassword.status).toBe(422);

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const missingUser = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1', newPassword: 'Newpass1' });
    expect(missingUser.status).toBe(404);

    const passwordHash = await bcrypt.hash('Password1', 4);
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', passwordHash });
    const wrongCurrent = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Wrongpass1', newPassword: 'Newpass1' });
    expect(wrongCurrent.status).toBe(401);
  });
});
