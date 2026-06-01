describe('stripe client', () => {
  const originalSecret = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = originalSecret;
  });

  it('throws when Stripe is not configured', () => {
    jest.resetModules();
    delete process.env.STRIPE_SECRET_KEY;

    const { getStripe } = require('./stripe') as typeof import('./stripe');

    expect(() => getStripe()).toThrow('Missing STRIPE_SECRET_KEY');
  });

  it('creates and reuses a Stripe client', () => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';

    const { getStripe } = require('./stripe') as typeof import('./stripe');
    const first = getStripe();
    const second = getStripe();

    expect(second).toBe(first);
  });
});
