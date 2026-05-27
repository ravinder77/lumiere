import { useState } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  value,
  max = 5,
  size = 14,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = interactive && hovered > 0 ? hovered : value;

  return (
    <div className={clsx('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= display;
        const half   = !filled && i + 0.5 <= display;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={clsx(
              'transition-transform',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              size={size}
              className={clsx(
                'transition-colors',
                filled || half ? 'fill-accent text-accent' : 'fill-stone-200 text-stone-200',
                interactive && hovered >= i + 1 && 'fill-accent-dark text-accent-dark'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
