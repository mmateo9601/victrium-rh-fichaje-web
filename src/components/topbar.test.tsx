import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useStoredSession: vi.fn(),
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
  useStoredSession: mocks.useStoredSession,
  signOut: mocks.signOut,
  getEffectiveRoles: (session: { user?: { roles?: string[] } } | null) => session?.user?.roles ?? []
}));

import { Topbar } from './topbar';

describe('Topbar', () => {
  beforeEach(() => {
    mocks.useStoredSession.mockReset();
    mocks.signOut.mockReset();
  });

  it('shows the shell navigation for authenticated users', () => {
    mocks.useStoredSession.mockReturnValue({
      user: {
        nombreEmpleado: 'Ada Admin',
        roles: ['ROLE_COMPANY_ADMIN']
      }
    });

    render(
      <Topbar>
        <div>content</div>
      </Topbar>
    );

    expect(screen.getByRole('link', { name: /inicio/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /empleados/i })).toHaveAttribute('href', '/employees');
    expect(screen.getAllByRole('button', { name: /cerrar sesión/i })).toHaveLength(1);
  });

  it('shows a reduced company-admin navigation without platform links', () => {
    mocks.useStoredSession.mockReturnValue({
      user: {
        nombreEmpleado: 'Paula Empresa',
        roles: ['ROLE_COMPANY_ADMIN']
      }
    });

    render(
      <Topbar>
        <div>content</div>
      </Topbar>
    );

    expect(screen.getByRole('link', { name: /empleados/i })).toHaveAttribute('href', '/employees');
    expect(screen.getByRole('link', { name: /planificación/i })).toHaveAttribute('href', '/schedule');
    expect(screen.getByRole('link', { name: /cuentas de acceso/i })).toHaveAttribute('href', '/users');
    expect(screen.queryByRole('link', { name: /plataforma/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /empresas/i })).toHaveAttribute('href', '/companies');
  });

  it('hides unauthorized route labels from the shell title', () => {
    mocks.useStoredSession.mockReturnValue({
      user: {
        nombreEmpleado: 'Laura Empleado',
        roles: ['ROLE_USER']
      }
    });
    mocks.usePathname.mockReturnValue('/users');

    render(
      <Topbar>
        <div>content</div>
      </Topbar>
    );

    expect(screen.getByText('Victrium RH')).toBeInTheDocument();
    expect(screen.queryByText(/cuentas de acceso/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });

  it('renders public routes without the app shell', () => {
    mocks.useStoredSession.mockReturnValue(null);
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
