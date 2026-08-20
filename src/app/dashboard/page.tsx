'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type PublicUser } from '../../lib/api/generated';
import { clearSession, getAccessToken, getStoredSession } from '../../lib/auth/session';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    async function load() {
      try {
        const token = getAccessToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        const authToken = token;
        const me = await api.auth.me(authToken);
        setUser(me);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Dashboard</span>
        <h1>Cargando sesión...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Sesión activa</span>
        <h1>Bienvenido{user ? `, ${user.nombreEmpleado}` : ''}.</h1>
        <p>
          Desde aquí puedes entrar a Companies, Users y Employees. La sesión está asociada a tu empresa
          y el backend decide el scope real.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        {user ? (
          <div className="grid-3" style={{ marginTop: '1.5rem' }}>
            <article className="stat">
              <strong>{user.numero}</strong>
              <span className="muted">Número de empleado</span>
            </article>
            <article className="stat">
              <strong>{user.companyId ?? 'Global'}</strong>
              <span className="muted">Empresa activa</span>
            </article>
            <article className="stat">
              <strong>{user.roles.join(', ') || 'Sin rol'}</strong>
              <span className="muted">Roles asignados</span>
            </article>
          </div>
        ) : null}
        <div className="hero-actions">
          <button className="button button-secondary" onClick={logout} type="button">
            Cerrar sesión
          </button>
          <Link className="button button-primary" href="/employees">
            Ir a empleados
          </Link>
        </div>
      </section>

      <section className="grid-auto">
        {[
          { href: '/companies', title: 'Companies', text: 'Gestiona el tenant y consulta tu empresa activa.' },
          { href: '/users', title: 'Users', text: 'Explora identidades, roles y estado de acceso.' },
          { href: '/employees', title: 'Employees', text: 'Listados, detalle, alta y activación.' },
          { href: '/time-entries', title: 'Fichajes', text: 'Registro rápido y listados de entrada/salida.' },
          { href: '/permissions', title: 'Permissions', text: 'Solicitudes de permisos, estados y métricas.' },
          { href: '/vacations', title: 'Vacations', text: 'Solicitudes, aprobación y seguimiento de ausencias.' },
          { href: '/incidents', title: 'Incidents', text: 'Incidencias, métricas y resolución de casos.' },
          { href: '/calendars', title: 'Calendars', text: 'Calendarios laborales y días configurados.' }
        ].map((item) => (
          <Link className="card stack" href={item.href} key={item.href}>
            <h2 className="card-title">{item.title}</h2>
            <p className="meta">{item.text}</p>
            <span className="button button-secondary" style={{ width: 'fit-content' }}>
              Abrir
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
