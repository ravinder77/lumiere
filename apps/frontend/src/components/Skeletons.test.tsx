import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ProductCardSkeleton,
  ProductDetailSkeleton,
  ProductGridSkeleton,
  ReviewSkeleton,
  Skeleton,
  TableRowSkeleton,
} from './Skeletons';

describe('Skeleton components', () => {
  it('renders reusable skeleton variants', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={3} />
        </tbody>
      </table>
    );
    expect(container.querySelectorAll('td')).toHaveLength(3);

    render(
      <>
        <Skeleton className="custom" />
        <ProductCardSkeleton />
        <ProductGridSkeleton count={2} />
        <ProductDetailSkeleton />
        <ReviewSkeleton />
      </>
    );

    expect(screen.getAllByText('', { selector: '.animate-pulse' }).length).toBeGreaterThan(0);
  });
});
