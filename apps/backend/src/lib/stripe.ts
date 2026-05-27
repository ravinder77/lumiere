import Stripe from 'stripe';

type StripeClient = InstanceType<typeof Stripe>;

let stripeClient: StripeClient | null = null;

export function getStripe(): StripeClient {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}
