import { Request, Response } from 'express';
import { products, categories } from '../data/products';
import { ApiResponse, PaginatedResponse, Product } from '../types';

function parsePositiveQueryInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parsePrice(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function listProducts(req: Request, res: Response) {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    sort = 'newest',
    page = '1',
    limit = '12',
  } = req.query as Record<string, string>;

  let filtered = [...products];

  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const parsedMinPrice = parsePrice(minPrice);
  if (parsedMinPrice !== null) {
    filtered = filtered.filter((p) => p.price >= parsedMinPrice);
  }

  const parsedMaxPrice = parsePrice(maxPrice);
  if (parsedMaxPrice !== null) {
    filtered = filtered.filter((p) => p.price <= parsedMaxPrice);
  }

  switch (sort) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }

  const pageNum = parsePositiveQueryInteger(page, 1);
  const limitNum = Math.min(50, parsePositiveQueryInteger(limit, 12));
  const start = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(start, start + limitNum);

  const response: ApiResponse<PaginatedResponse<Product>> = {
    success: true,
    data: {
      items: paginated,
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filtered.length / limitNum),
    },
  };

  res.json(response);
}

export function getFeaturedProducts(_req: Request, res: Response) {
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const response: ApiResponse<Product[]> = { success: true, data: featured };
  res.json(response);
}

export function listCategories(_req: Request, res: Response) {
  res.json({ success: true, data: categories });
}

export function getProductById(req: Request, res: Response) {
  const product = products.find((p) => p.id === req.params['id']);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product not found' });
    return;
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({ success: true, data: { product, related } });
}
