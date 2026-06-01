import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import Footer from './Footer';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Footer', () => {
  it('validates newsletter emails and clears valid submissions', async () => {
    const user = userEvent.setup();
    render(<Footer />, { wrapper: MemoryRouter });

    const input = screen.getByPlaceholderText('your@email.com');
    await user.type(input, 'not-an-email');
    await user.click(screen.getByRole('button', { name: '→' }));
    expect(toast.error).toHaveBeenCalledWith('Enter a valid email');

    await user.clear(input);
    await user.type(input, 'reader@example.com');
    await user.click(screen.getByRole('button', { name: '→' }));

    expect(toast.success).toHaveBeenCalledWith("You're subscribed!");
    expect(input).toHaveValue('');
  });
});
