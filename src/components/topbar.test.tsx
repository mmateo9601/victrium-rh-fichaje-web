import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getStoredSession: vi.fn()
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock('../lib/auth/session', () => ({
  getStoredSession: mocks.getStoredSession
}));

import { Topbar } from './topbar';

describe('Topbar', () => {
  beforeEach(() => {
    mocks.getStoredSession.mockReset();
  });

  it('shows the login entry when there is no session', () => {
    mocks.getStoredSession.mockReturnValue(null);

    render(<Topbar />);

    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
  });

  it('shows admin navigation when the user has admin roles', () => {
    mocks.getStoredSession.mockReturnValue({
      user: {
        nombreEmpleado: 'Ada Admin',
        roles: ['ROLE_ADMIN']
      }
    });

    render(<Topbar />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /companies/i })).toHaveAttribute('href', '/companies');
    expect(screen.getByRole('link', { name: /users/i })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: /employees/i })).toHaveAttribute('href', '/employees');
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: /api keys/i })).toHaveAttribute('href', '/api-keys');
  });
});
