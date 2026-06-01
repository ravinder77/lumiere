import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Thrower(): React.ReactElement {
  throw new Error('Broken render');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: vi.fn() },
    });
  });

  it('renders children when no error is thrown', () => {
    render(<ErrorBoundary><div>Safe</div></ErrorBoundary>);

    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('renders fallback UI and reloads on retry', async () => {
    const user = userEvent.setup();
    render(<ErrorBoundary><Thrower /></ErrorBoundary>);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Broken render')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('uses a custom fallback when provided', () => {
    render(<ErrorBoundary fallback={<div>Custom fallback</div>}><Thrower /></ErrorBoundary>);

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });
});
