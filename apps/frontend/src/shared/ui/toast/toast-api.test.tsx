import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import toast, { Toaster } from './toast-api';

describe('toast api', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders success, error, and info toasts and removes them after timeout', async () => {
    vi.useFakeTimers();

    render(<Toaster position="top-left" toastOptions={{ style: { color: 'red' } }} />);

    act(() => {
      toast.success('Saved');
      toast.error('Failed');
      toast.message('Heads up');
    });

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Heads up')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('supports each toast position', () => {
    render(
      <>
        <Toaster position="bottom-left" />
        <Toaster position="top-right" />
        <Toaster position="top-left" />
        <Toaster />
      </>
    );

    expect(document.body.innerHTML).toContain('bottom-4 left-4');
    expect(document.body.innerHTML).toContain('top-4 right-4');
    expect(document.body.innerHTML).toContain('top-4 left-4');
    expect(document.body.innerHTML).toContain('bottom-4 right-4');
  });
});
