'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Building2,
  CalendarRange,
  Clock3,
  Home,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Users,
  BriefcaseBusiness,
  UserRound
} from 'lucide-react';

import { getStoredSession, signOut } from '../lib/auth/session';
import { getRoleLabel } from '../lib/labels';
import { canAccessNavigationItem, getNavigationTitle, navigationGroups, type RoleName } from '../lib/navigation';

type TopbarProps = {
  children: ReactNode;
};

function routeIsPublic(pathname: string) {
  return pathname === '/' || pathname.startsWith('/login');
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const iconMap = {
  home: Home,
  clock: Clock3,
  users: Users,
  calendar: CalendarRange,
  building: Building2,
  briefcase: BriefcaseBusiness,
  shield: ShieldCheck,
  user: UserRound,
  sparkles: Sparkles,
  'layout-grid': LayoutGrid
} as const;

export function Topbar({ children }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const session = useMemo(() => getStoredSession(), []);
  const roles = (session?.user.roles ?? []) as RoleName[];
  const isPublicRoute = routeIsPublic(pathname);
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessNavigationItem(item, roles))
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const win = globalThis.window;
    const doc = globalThis.document;
    if (!win || !doc) {
      return undefined;
    }

    doc.body.classList.add('no-scroll');
    win.addEventListener('keydown', onKeyDown);

    return () => {
      doc.body.classList.remove('no-scroll');
      win.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  async function logout() {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <div className={`shell-overlay ${mobileOpen ? 'is-open' : ''}`} onClick={() => setMobileOpen(false)} />

      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
        <div className="sidebar__brand">
          <Link className="brand brand--sidebar" href={session ? '/dashboard' : '/'}>
            <span className="brand-mark">VR</span>
            <span className="brand-text">
              <strong>Victrium RH</strong>
              <small>Gestión de personas</small>
            </span>
          </Link>
        </div>

        <nav className="sidebar__nav" aria-label="Secciones">
          {visibleGroups.map((group) => (
            <section key={group.label} className="sidebar-group">
              <h2>{group.label}</h2>
              <ul>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = iconMap[item.icon];
                  return (
                    <li key={item.href}>
                      <Link className={active ? 'sidebar-link is-active' : 'sidebar-link'} href={item.href}>
                        <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
                        <strong>{item.label}</strong>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div className="sidebar__footer">
          {session ? (
            <div className="profile-chip">
              <span className="profile-chip__avatar">{session.user.nombreEmpleado?.charAt(0) ?? 'V'}</span>
              <div>
                <strong>{session.user.nombreEmpleado}</strong>
                <small>{getRoleLabel(session.user.roles as RoleName[])}</small>
              </div>
            </div>
          ) : (
            <div className="profile-chip profile-chip--empty">
              <span className="profile-chip__avatar">VR</span>
              <div>
                <strong>Victrium RH</strong>
                <small>Acceso restringido</small>
              </div>
            </div>
          )}
          <div className="sidebar__actions">
            {session ? (
              <Link className="button button-secondary button-full" href="/profile">
                Perfil
              </Link>
            ) : (
              <Link className="button button-secondary button-full" href="/login">
                Acceder
              </Link>
            )}
            {session ? (
              <button className="button button-ghost button-full" type="button" onClick={() => void logout()} disabled={loggingOut}>
                {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__left">
            <button className="icon-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación">
              <span />
              <span />
              <span />
            </button>
            <div className="stack">
              <span className="app-topbar__eyebrow">Victrium RH</span>
              <strong className="app-topbar__title">{getNavigationTitle(pathname)}</strong>
            </div>
          </div>

          <div className="app-topbar__right">
            {session ? <span className="session-pill">{getRoleLabel(roles)}</span> : null}
            {session ? (
              <button className="button button-secondary" type="button" onClick={() => void logout()} disabled={loggingOut}>
                {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </button>
            ) : (
              <Link className="button button-secondary" href="/login">
                Entrar
              </Link>
            )}
          </div>
        </header>

        <main id="main-content" className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
