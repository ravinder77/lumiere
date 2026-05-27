import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import type { Order } from '../generated/prisma/client';

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

function getCustomerEmail(order: Order): string | null {
  const customer = order.customer as { email?: unknown } | null;
  return typeof customer?.email === 'string' ? customer.email.toLowerCase() : null;
}

function canAccessOrder(req: AuthRequest, order: Order, email?: string): boolean {
  if (req.user?.role === 'ADMIN') {
    return true;
  }

  if (req.user?.userId && order.userId === req.user.userId) {
    return true;
  }

  if (!email) {
    return false;
  }

  return getCustomerEmail(order) === email.toLowerCase();
}

export function rejectDirectOrderCreation(_req: Request, res: Response) {
  res.status(400).json({
    success: false,
    error: 'Use POST /api/checkout/session to create a Stripe-backed checkout session.',
  });
}

export async function getOrderById(req: AuthRequest, res: Response) {
  const order = await prisma.order.findUnique({ where: { id: param(req, 'id') } });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const rawEmail = req.query['email'];
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : undefined;
  if (!canAccessOrder(req, order, email)) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  res.json({ success: true, data: order });
}

export async function listMyOrders(req: AuthRequest, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: orders });
}
