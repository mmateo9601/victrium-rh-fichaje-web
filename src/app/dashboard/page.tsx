'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { WorkTimer } from '../../components/work-timer';
import {
  api,
  type Incident,
  type Permission,
  type PublicUser,
  type TimeEntry,
  type Vacation
} from '../../lib/api/generated';
import { getAccessToken, getStoredSession, signOut } from '../../lib/auth/session';

export default function DashboardPage() {
  const router = useRouter();
  const token = getAccessToken();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [latestTimeEntry, setLatestTimeEntry] = useState<TimeEntry | null>(null);
  const [latestVacation, setLatestVacation] = useState<Vacation | null>(null);
  const [latestPermission, setLatestPermission] = useState<Permission | null>(null);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [timeEntriesCount, setTimeEntriesCount] = useState(0);
  const [vacationsCount, setVacationsCount] = useState(0);
  const [permissionsCount, setPermissionsCount] = useState(0);
  const [incidentsCount, setIncidentsCount] = useState(0);
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

        const me = await api.auth.me(token);
        setUser(me);

        const isAdmin = me.roles.includes('ROLE_ADMIN') || me.roles.includes('ROLE_RRHH');
        const [timeEntries, vacations, permissions, incidents] = await Promise.all([
          isAdmin ? api.timeEntries.list(token, { pageSize: 1, sort: 'id', order: 'desc' }) : api.timeEntries.mine(token, { pageSize: 1, sort: 'id', order: 'desc' }),
          isAdmin ? api.vacations.list(token, { pageSize: 1, sort: 'id', order: 'desc' }) : api.vacations.mine(token, { pageSize: 1, sort: 'id', order: 'desc' }),
          isAdmin ? api.permissions.list(token, { pageSize: 1, sort: 'id', order: 'desc' }) : api.permissions.mine(token, { pageSize: 1, sort: 'id', order: 'desc' }),
          isAdmin ? api.incidents.list(token, { pageSize: 1, sort: 'id', order: 'desc' }) : api.incidents.mine(token, { pageSize: 1, sort: 'id', order: 'desc' })
        ]);

        setTimeEntriesCount(timeEntries.pagination.total);
        setVacationsCount(vacations.pagination.total);
        setPermissionsCount(permissions.pagination.total);
        setIncidentsCount(incidents.pagination.total);
        setLatestTimeEntry(timeEntries.data[0] ?? null);
        setLatestVacation(vacations.data[0] ?? null);
        setLatestPermission(permissions.data[0] ?? null);
        setLatestIncident(incidents.data[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function logout() {
    await signOut();
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
      <PageHeader
        eyebrow="Sesión activa"
        title={`Bienvenido${user ? `, ${user.nombreEmpleado}` : ''}.`}
        description="La página principal pone la jornada en primer plano y deja el resto de la operativa como contexto útil."
        actions={
          <>
            <button className="button button-secondary" onClick={logout} type="button">
              Cerrar sesión
            </button>
          </>
        }
        stats={
          user ? (
            <>
              <div className="stat">
                <strong>{user.numero}</strong>
                <span className="muted">Empleado</span>
              </div>
              <div className="stat">
                <strong>{user.companyId ?? 'Global'}</strong>
                <span className="muted">Empresa</span>
              </div>
              <div className="stat">
                <strong>{user.roles.join(', ') || 'Sin rol'}</strong>
                <span className="muted">Acceso</span>
              </div>
            </>
          ) : null
        }
      />

      {error ? <div className="notice" role="alert">{error}</div> : null}

      <div className="two-col">
        {user && token ? <WorkTimer token={token} /> : null}

        <section className="panel stack">
          <div className="toolbar">
            <div className="stack">
              <span className="eyebrow">Actividad</span>
              <h2 className="section-title">Últimos movimientos</h2>
            </div>
          </div>

          <div className="activity-list">
            <article className="activity-item">
              <span className="activity-item__label">Fichajes</span>
              <strong>{timeEntriesCount}</strong>
              <p>{latestTimeEntry ? `${latestTimeEntry.tipo} · ${new Date(latestTimeEntry.dia).toLocaleDateString('es-ES')} ${latestTimeEntry.hora}` : 'Sin fichajes recientes'}</p>
            </article>
            <article className="activity-item">
              <span className="activity-item__label">Vacaciones</span>
              <strong>{vacationsCount}</strong>
              <p>{latestVacation ? `${latestVacation.estado} · ${new Date(latestVacation.inicio).toLocaleDateString('es-ES')}` : 'Sin vacaciones recientes'}</p>
            </article>
            <article className="activity-item">
              <span className="activity-item__label">Permisos</span>
              <strong>{permissionsCount}</strong>
              <p>{latestPermission ? `${latestPermission.estado} · ${new Date(latestPermission.dia).toLocaleDateString('es-ES')}` : 'Sin permisos recientes'}</p>
            </article>
            <article className="activity-item">
              <span className="activity-item__label">Incidencias</span>
              <strong>{incidentsCount}</strong>
              <p>{latestIncident ? `${latestIncident.resuelta ? 'Resuelta' : 'Abierta'} · ${new Date(latestIncident.dia).toLocaleDateString('es-ES')}` : 'Sin incidencias recientes'}</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
