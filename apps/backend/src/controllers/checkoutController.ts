import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { getCart } from '../lib/cartStore';
import { AuthRequest } from '../middleware/auth';
import type { Cart, Customer } from '../types';

interface StripeSessionLike {
  id: string;
  status: string | null;
  payment_status: string | null;
  payment_intent?: string | { id: string } | null;
}

interface StripeChargeLike {
  payment_intent?: string | null;
}

const SUPPORTED_STATUSES = new Set(['open', 'complete', 'expired']);

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function getBaseUrl(req: Request, returnUrl?: string): string {
  if (returnUrl) {
    return returnUrl.replace(/\/$/, '');
  }

  const origin = req.get('origin');
  if (origin) {
    return origin.replace(/\/$/, '');
  }

  return 'http://localhost:5173';
}

function isCustomer(value: unknown): value is Customer {
  if (!value || typeof value !== 'object') return false;
  const customer = value as Customer;

  return Boolean(
    customer.name &&
      customer.email &&
      customer.address?.line1 &&
      customer.address?.city &&
      customer.address?.state &&
      customer.address?.zip &&
      customer.address?.country
  );
}

function getOrderCustomerEmail(order: { customer: unknown }): string | null {
  const customer = order.customer as { email?: unknown } | null;
  return typeof customer?.email === 'string' ? customer.email.toLowerCase() : null;
}

function canAccessOrder(req: AuthRequest, order: { userId: string | null; customer: unknown }, email?: string): boolean {
  if (req.user?.role === 'ADMIN') {
    return true;
  }

  if (req.user?.userId && order.userId === req.user.userId) {
    return true;
  }

  if (!email) {
    return false;
  }

  return getOrderCustomerEmail(order) === email.toLowerCase();
}

function assertCart(cartId: string): Cart {
  const cart = getCart(cartId);
  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty or unavailable');
  }

  return cart;
}

async function syncOrderFromSession(session: StripeSessionLike) {
  const order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });

  if (!order) {
    throw new Error('Order not found for checkout session');
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const isPaid = session.payment_status === 'paid';
  const nextPaymentStatus = isPaid ? 'PAID' : session.status === 'expired' ? 'FAILED' : 'PENDING';
  const nextOrderStatus = isPaid ? 'PROCESSING' : order.status;

  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: nextPaymentStatus,
      status: nextOrderStatus,
      stripePaymentIntentId: paymentIntentId ?? undefined,
    },
  });
}

export async function createCheckoutSession(req: AuthRequest, res: Response) {
  const { cartId, customer, returnUrl } = req.body as {
    cartId?: string;
    customer?: unknown;
    returnUrl?: string;
  };

  if (!cartId || !isCustomer(customer)) {
    res.status(400).json({ success: false, error: 'Missing checkout details' });
    return;
  }

  let cart: Cart;
  try {
    cart = assertCart(cartId);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
    return;
  }

  const appBaseUrl = getBaseUrl(req, returnUrl);
  const order = await prisma.order.create({
    data: {
      cartId: cart.id,
      currency: 'usd',
      items: cart.items as object[],
      subtotal: cart.subtotal,
      discount: cart.discount,
      shipping: 0,
      total: cart.total,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      customer: customer as object,
      ...(req.user ? { userId: req.user.userId } : {}),
    },
  });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customer.email,
    client_reference_id: order.id,
    success_url: `${appBaseUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/checkout?cancelled=1`,
    metadata: {
      orderId: order.id,
      cartId: cart.id,
      userId: req.user?.userId ?? '',
    },
    line_items: cart.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: toCents(item.product.price),
        product_data: {
          name: item.product.name,
          images: item.product.image ? [item.product.image] : undefined,
          metadata: {
            productId: item.productId,
          },
        },
      },
    })),
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        cartId: cart.id,
      },
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      sessionId: session.id,
      url: session.url,
    },
  });
}

export async function getCheckoutSession(req: AuthRequest, res: Response) {
  const rawSessionId = req.params['sessionId'];
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  if (!sessionId) {
    res.status(400).json({ success: false, error: 'Missing session id' });
    return;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });

  if (!SUPPORTED_STATUSES.has(session.status ?? '')) {
    res.status(400).json({ success: false, error: 'Unexpected checkout session status' });
    return;
  }

  const existingOrder = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (!existingOrder) {
    res.status(404).json({ success: false, error: 'Order not found for checkout session' });
    return;
  }

  const rawEmail = req.query['email'];
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : undefined;
  if (!canAccessOrder(req, existingOrder, email)) {
    res.status(404).json({ success: false, error: 'Checkout session not found' });
    return;
  }

  const order = await syncOrderFromSession(session);

  res.json({
    success: true,
    data: {
      order,
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
      },
    },
  });
}

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const signatureHeader = req.headers['stripe-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    res.status(400).json({ success: false, error: 'Missing Stripe webhook configuration' });
    return;
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
      const session = event.data.object as StripeSessionLike;
      await syncOrderFromSession(session);
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as StripeChargeLike;
      if (typeof charge.payment_intent === 'string') {
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: charge.payment_intent },
          data: { paymentStatus: 'REFUNDED' },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${(error as Error).message}`);
  }
};

export const stripeWebhookMiddleware = express.raw({ type: 'application/json' });
