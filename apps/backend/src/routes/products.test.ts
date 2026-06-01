import request from 'supertest';
import { createApp } from '../app/createApp';

describe('products API', () => {
  const app = createApp();

  it('returns paginated products', async () => {
    const response = await request(app).get('/api/products').query({ limit: 2, page: 1 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(2);
    expect(response.body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('falls back to stable pagination when pagination query values are invalid', async () => {
    const response = await request(app).get('/api/products').query({ limit: 'wat', page: 'also-wat' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(12);
    expect(response.body.data.items).toHaveLength(12);
  });

  it('filters and sorts products', async () => {
    const response = await request(app)
      .get('/api/products')
      .query({ category: 'electronics', search: 'headphones', sort: 'price-desc' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].name).toBe('Noise-Cancelling Headphones');
  });

  it('ignores invalid price filters instead of producing invalid pagination totals', async () => {
    const response = await request(app).get('/api/products').query({ minPrice: 'nope', maxPrice: 'also-nope' });

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(12);
    expect(response.body.data.totalPages).toBe(1);
  });

  it('applies valid price filters and alternate sorts', async () => {
    const priceAsc = await request(app)
      .get('/api/products')
      .query({ minPrice: '50', maxPrice: '100', sort: 'price-asc' });
    expect(priceAsc.status).toBe(200);
    expect(priceAsc.body.data.items[0].price).toBeLessThanOrEqual(priceAsc.body.data.items.at(-1).price);

    const rating = await request(app).get('/api/products').query({ sort: 'rating', limit: 3 });
    expect(rating.status).toBe(200);
    expect(rating.body.data.items[0].rating).toBeGreaterThanOrEqual(rating.body.data.items[1].rating);
  });

  it('returns featured products and categories', async () => {
    const [featured, categories] = await Promise.all([
      request(app).get('/api/products/featured'),
      request(app).get('/api/products/categories'),
    ]);

    expect(featured.status).toBe(200);
    expect(featured.body.data.every((product: { featured?: boolean }) => product.featured)).toBe(true);
    expect(categories.status).toBe(200);
    expect(categories.body.data.map((category: { id: string }) => category.id)).toContain('electronics');
  });

  it('returns a product with related products', async () => {
    const response = await request(app).get('/api/products/2');

    expect(response.status).toBe(200);
    expect(response.body.data.product.id).toBe('2');
    expect(response.body.data.related.every((product: { category: string }) => product.category === 'electronics')).toBe(true);
  });

  it('returns 404 for an unknown product', async () => {
    const response = await request(app).get('/api/products/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, error: 'Product not found' });
  });
});
