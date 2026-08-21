import Link from 'next/link';

import { PageHeader } from '../components/page-header';
import { env } from '../lib/config';

export default function Page() {
  return (
    <main className="home-shell">
      <PageHeader
        eyebrow="Victrium RH"
        title="Control horario y gestión de personas con una experiencia clara, rápida y empresarial."
        description={`La Web habla exclusivamente con la API versionada en ${env.apiBaseUrl} y está preparada para operar con roles, tenants y permisos sin perder claridad visual.`}
        actions={
          <>
            <Link className="button button-primary" href="/login">
              Entrar a la app
            </Link>
            <Link className="button button-secondary" href="/dashboard">
              Ver dashboard
            </Link>
          </>
        }
        stats={
          <>
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
          </>
        }
      />
    </main>
  );
}
