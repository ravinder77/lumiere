const mockPrisma = {
  order: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../lib/stripe', () => ({
  getStripe: jest.fn(() => mockStripe),
}));

import request from 'supertest';
import { createApp } from '../app/createApp';
import { signAccessToken } from '../lib/jwt';

const customer = {
  name: 'Test User',
  email: 'guest@example.com',
  address: {
    line1: '1 Test St',
    city: 'Testville',
    state: 'CA',
    zip: '90001',
    country: 'US',
  },
};

describe('checkout API', () => {
  const app = createApp();
  const token = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'CUSTOMER' });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  async function cartWithItem() {
    const cart = await request(app).post('/api/cart');
    await request(app)
      .post(`/api/cart/${cart.body.data.id}/items`)
      .send({ productId: '2', quantity: 1 });
    return cart.body.data.id as string;
  }

  it('validates checkout session input and empty carts', async () => {
    const missing = await request(app).post('/api/checkout/session').send({});
    expect(missing.status).toBe(400);

    const cart = await request(app).post('/api/cart');
    const empty = await request(app)
      .post('/api/checkout/session')
      .send({ cartId: cart.body.data.id, customer, returnUrl: 'http://localhost:5173/' });
    expect(empty.status).toBe(400);
    expect(empty.body.error).toBe('Cart is empty or unavailable');
  });

  it('creates Stripe checkout sessions for valid carts', async () => {
    const cartId = await cartWithItem();
    mockPrisma.order.create.mockResolvedValue({
      id: 'order-1',
      cartId,
      subtotal: 349.99,
      discount: 0,
      total: 349.99,
    });
    mockPrisma.order.update.mockResolvedValue({});
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.test/session',
    });

    const response = await request(app)
      .post('/api/checkout/session')
      .set('Authorization', `Bearer ${token}`)
      .send({ cartId, customer, returnUrl: 'http://localhost:5173/' });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      orderId: 'order-1',
      sessionId: 'cs_test_1',
      url: 'https://checkout.stripe.test/session',
    });
    expect(mockStripe.checkout.sessions.create.mock.calls[0][0].metadata.userId).toBe('user-1');
  });

  it('falls back to request origin for checkout return URLs', async () => {
    const cartId = await cartWithItem();
    mockPrisma.order.create.mockResolvedValue({
      id: 'order-origin',
      cartId,
      subtotal: 349.99,
      discount: 0,
      total: 349.99,
    });
    mockPrisma.order.update.mockResolvedValue({});
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_origin',
      url: 'https://checkout.stripe.test/origin',
    });

    const response = await request(app)
      .post('/api/checkout/session')
      .set('origin', 'http://shop.example.test/')
      .send({ cartId, customer });

    expect(response.status).toBe(201);
    expect(mockStripe.checkout.sessions.create.mock.calls[0][0].success_url).toBe(
      'http://shop.example.test/checkout?session_id={CHECKOUT_SESSION_ID}'
    );
  });

  it('retrieves accessible checkout sessions and syncs order state', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_test_1',
      status: 'complete',
      payment_status: 'paid',
      payment_intent: { id: 'pi_1' },
    });
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      userId: null,
      customer: { email: 'guest@example.com' },
      status: 'PENDING',
    });
    mockPrisma.order.update.mockResolvedValue({
      id: 'order-1',
      paymentStatus: 'PAID',
      status: 'PROCESSING',
    });

    const response = await request(app).get('/api/checkout/session/cs_test_1').query({ email: 'guest@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.data.session.paymentStatus).toBe('paid');
    expect(mockPrisma.order.update.mock.calls[0][0].data.stripePaymentIntentId).toBe('pi_1');
  });

  it('rejects inaccessible or unexpected checkout sessions', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: 'cs_test_1',
      status: 'weird',
      payment_status: 'unpaid',
    });
    const unsupported = await request(app).get('/api/checkout/session/cs_test_1');
    expect(unsupported.status).toBe(400);

    mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: 'cs_missing_order',
      status: 'open',
      payment_status: 'unpaid',
    });
    mockPrisma.order.findUnique.mockResolvedValueOnce(null);
    const missingOrder = await request(app).get('/api/checkout/session/cs_missing_order');
    expect(missingOrder.status).toBe(404);

    mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: 'cs_forbidden',
      status: 'open',
      payment_status: 'unpaid',
    });
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      id: 'order-1',
      userId: 'someone-else',
      customer: { email: 'guest@example.com' },
    });
    const forbidden = await request(app)
      .get('/api/checkout/session/cs_forbidden')
      .set('Authorization', `Bearer ${token}`);
    expect(forbidden.status).toBe(404);
  });

  it('handles Stripe webhook events', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
    });
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockStripe.webhooks.constructEvent
      .mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_1', status: 'complete', payment_status: 'paid', payment_intent: 'pi_1' } },
      })
      .mockReturnValueOnce({
        type: 'charge.refunded',
        data: { object: { payment_intent: 'pi_1' } },
      });

    const completed = await request(app)
      .post('/api/checkout/webhook')
      .set('stripe-signature', 'sig_test')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));
    expect(completed.status).toBe(200);

    const refunded = await request(app)
      .post('/api/checkout/webhook')
      .set('stripe-signature', 'sig_test')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));
    expect(refunded.status).toBe(200);
    expect(mockPrisma.order.updateMany).toHaveBeenCalled();
  });

  it('returns webhook errors for missing configuration and invalid payloads', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const missingConfig = await request(app)
      .post('/api/checkout/webhook')
      .set('stripe-signature', 'sig_test')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));
    expect(missingConfig.status).toBe(400);

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('bad signature');
    });
    const invalid = await request(app)
      .post('/api/checkout/webhook')
      .set('stripe-signature', 'sig_test')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));
    expect(invalid.status).toBe(400);
    expect(invalid.text).toContain('Webhook Error');
  });

  it('passes unexpected checkout failures through the app error handler', async () => {
    const cartId = await cartWithItem();
    mockPrisma.order.create.mockRejectedValue(new Error('database unavailable'));

    const response = await request(app).post('/api/checkout/session').send({ cartId, customer });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ success: false, error: 'Internal server error' });

    process.env.NODE_ENV = 'development';
    const development = await request(app).post('/api/checkout/session').send({ cartId, customer });
    expect(development.status).toBe(500);
    expect(development.body.error).toBe('database unavailable');
    process.env.NODE_ENV = 'test';
  });
});
