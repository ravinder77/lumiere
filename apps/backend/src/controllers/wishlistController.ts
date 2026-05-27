import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { products } from '../data/products';

export async function listWishlist(req: AuthRequest, res: Response) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = items
    .map((item: { id: string; userId: string; productId: string; createdAt: Date }) => {
      const product = products.find((p) => p.id === item.productId);
      return { ...item, product: product ?? null };
    })
    .filter((item: { product: unknown }) => item.product !== null);

  res.json({ success: true, data: enriched });
}

export async function addWishlistItem(req: AuthRequest, res: Response) {
  const { productId } = req.body as { productId: string };

  if (!productId) {
    res.status(400).json({ success: false, error: 'productId is required' });
    return;
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product not found' });
    return;
  }

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    update: {},
    create: { userId: req.user!.userId, productId },
  });

  res.status(201).json({ success: true, data: { ...item, product }, message: 'Added to wishlist' });
}

export async function removeWishlistItem(req: AuthRequest, res: Response) {
  const productId = req.params['productId'] as string;

  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch {
    res.status(404).json({ success: false, error: 'Item not in wishlist' });
  }
}

export async function listWishlistIds(req: AuthRequest, res: Response) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.userId },
    select: { productId: true },
  });
  res.json({ success: true, data: items.map((i: { productId: string }) => i.productId) });
}
