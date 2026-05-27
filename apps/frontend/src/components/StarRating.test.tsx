import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders one button per star', () => {
    render(<StarRating value={3} max={5} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('disables stars when the rating is read-only', () => {
    render(<StarRating value={4} />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveProperty('disabled', true);
    }
  });

  it('calls onChange with the selected rating when interactive', () => {
    const onChange = vi.fn();
    render(<StarRating value={0} interactive onChange={onChange} />);

    screen.getAllByRole('button')[3]?.click();

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
