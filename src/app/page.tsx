import Link from 'next/link';

import { env } from '../lib/config';

export default function Page() {
  return (
    <section className="hero">
      <span className="eyebrow">NestJS + Next.js + MySQL</span>
      <h1>Fichaje RH modular para operar por empresa, usuarios y empleados.</h1>
      <p>
        La nueva Web habla exclusivamente con la API versionada en <strong>{env.apiBaseUrl}</strong> y
        está preparada para trabajar con roles y aislamiento multiempresa.
      </p>
      <div className="hero-actions">
        <Link className="button button-primary" href="/login">
          Entrar a la app
        </Link>
        <Link className="button button-secondary" href="/dashboard">
          Ver dashboard
        </Link>
        <Link className="button button-secondary" href="/vacations">
          Vacations
        </Link>
        <Link className="button button-secondary" href="/time-entries">
          Fichajes
        </Link>
        <Link className="button button-secondary" href="/permissions">
          Permissions
        </Link>
        <Link className="button button-secondary" href="/incidents">
          Incidents
        </Link>
        <Link className="button button-secondary" href="/calendars">
          Calendars
        </Link>
      </div>
      <div className="grid-3" style={{ marginTop: '2rem' }}>
        <article className="stat">
          <strong>Auth</strong>
          <span className="muted">JWT access/refresh y sesión local.</span>
        </article>
        <article className="stat">
          <strong>Tenant</strong>
          <span className="muted">Scope derivado del usuario autenticado.</span>
        </article>
        <article className="stat">
          <strong>Responsive</strong>
          <span className="muted">Listados, detalle y formularios adaptables.</span>
        </article>
      </div>
    </section>
  );
}
