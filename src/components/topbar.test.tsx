import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getStoredSession: vi.fn(),
  signOut: vi.fn(),
  usePathname: vi.fn(() => '/dashboard')
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock('next/navigation', () => ({
  usePathname: mocks.usePathname,
  useRouter: () => ({
    push: vi.fn()
  })
}));

vi.mock('../lib/auth/session', () => ({
  getStoredSession: mocks.getStoredSession,
  signOut: mocks.signOut
}));

import { Topbar } from './topbar';

describe('Topbar', () => {
  beforeEach(() => {
    mocks.getStoredSession.mockReset();
    mocks.signOut.mockReset();
  });

  it('shows the shell navigation for authenticated users', () => {
    mocks.getStoredSession.mockReturnValue({
      user: {
        nombreEmpleado: 'Ada Admin',
        roles: ['ROLE_ADMIN']
      }
    });

    render(
      <Topbar>
        <div>content</div>
      </Topbar>
    );

    expect(screen.getByRole('link', { name: /inicio/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /empleados/i })).toHaveAttribute('href', '/employees');
    expect(screen.getAllByRole('button', { name: /cerrar sesión/i })).toHaveLength(2);
  });

  it('renders public routes without the app shell', () => {
    mocks.getStoredSession.mockReturnValue(null);
    mocks.usePathname.mockReturnValue('/login');

    render(
      <Topbar>
        <div>public content</div>
      </Topbar>
    );

    expect(screen.getByText('public content')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
