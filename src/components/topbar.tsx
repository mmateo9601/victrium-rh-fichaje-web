'use client';

import Link from 'next/link';

import { getStoredSession } from '../lib/auth/session';

export function Topbar() {
  const session = getStoredSession();
  const roles = session?.user.roles ?? [];
  const canSeeAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_RRHH');

  return (
    <header className="topbar">
      <Link className="brand" href={session ? '/dashboard' : '/'}>
        <span className="brand-mark">VR</span>
        <span className="brand-text">
          <strong>Victrium RH</strong>
          <small>{session ? session.user.nombreEmpleado : 'Fichaje modular'}</small>
        </span>
      </Link>
      <nav className="topnav" aria-label="Principal">
        {session ? <Link href="/dashboard">Dashboard</Link> : null}
        {canSeeAdmin ? <Link href="/companies">Companies</Link> : null}
        {canSeeAdmin ? <Link href="/users">Users</Link> : null}
        {canSeeAdmin ? <Link href="/employees">Employees</Link> : null}
        {session ? <Link href="/time-entries">Fichajes</Link> : null}
        {session ? <Link href="/permissions">Permissions</Link> : null}
        {session ? <Link href="/vacations">Vacations</Link> : null}
        {session ? <Link href="/incidents">Incidents</Link> : null}
        {session ? <Link href="/profile">Profile</Link> : null}
        {canSeeAdmin ? <Link href="/calendars">Calendars</Link> : null}
        {canSeeAdmin ? <Link href="/api-keys">API Keys</Link> : null}
        {session ? null : <Link href="/login">Login</Link>}
      </nav>
    </header>
  );
}
