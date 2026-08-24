'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Clock3, ShieldAlert, TimerReset, Users2 } from 'lucide-react';

import { AnalyticsChart } from '../../components/analytics-chart';
import { PageHeader } from '../../components/page-header';
import { WorkTimer } from '../../components/work-timer';
import {
  api,
  type Company,
  type Incident,
  type Permission,
  type PublicUser,
  type TimeEntry,
  type Vacation
} from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
import {
  formatDurationLabel,
  formatInputDate,
  formatLongDate,
  getPermissionStatusLabel,
  getRoleLabel,
  getVacationStatusLabel,
  hasManagementAccess
} from '../../lib/labels';
import { buildWorkedDays, buildWorkedSummary } from '../../lib/time-analytics';
import { collectAllPages } from '../../lib/csv';

type DashboardScope = 'employee' | 'manager';

function startOfWeekLabel() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  return { from: formatInputDate(start), to: formatInputDate(today) };
}

function timeEntryLabel(entry: TimeEntry) {
  return `${entry.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} · ${entry.hora}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const token = getAccessToken();
  const [sessionUser, setSessionUser] = useState<PublicUser | null>(null);
  const [scope, setScope] = useState<DashboardScope>('employee');
  const [weeklyEntries, setWeeklyEntries] = useState<TimeEntry[]>([]);
  const [recentTimeEntries, setRecentTimeEntries] = useState<TimeEntry[]>([]);
  const [latestVacation, setLatestVacation] = useState<Vacation | null>(null);
  const [latestPermission, setLatestPermission] = useState<Permission | null>(null);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [workingNow, setWorkingNow] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [openIncidents, setOpenIncidents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekRange = useMemo(() => startOfWeekLabel(), []);
  const workedDays = useMemo(() => buildWorkedDays(weeklyEntries, 7), [weeklyEntries]);
  const weekSummary = useMemo(() => buildWorkedSummary(weeklyEntries), [weeklyEntries]);
  const chartData = useMemo(
    () =>
      workedDays.map((item) => ({
        label: item.label,
        value: Math.round(item.minutes / 60)
      })),
    [workedDays]
  );

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    async function load() {
      try {
        const authToken = getAccessToken();
        if (!authToken) {
          router.replace('/login');
          return;
        }

        const me = await api.auth.me(authToken);
        setSessionUser(me);
        const isManager = hasManagementAccess(me.roles);
        setScope(isManager ? 'manager' : 'employee');
        if (me.companyId) {
          try {
            const currentCompany = await api.companies.mine(authToken);
            setCompany(currentCompany);
          } catch {
            setCompany(null);
          }
        }

        const weekQuery = {
          from: weekRange.from,
          to: weekRange.to,
          order: 'asc' as const
        };

        const [weekList, vacations, permissions, incidents] = await Promise.all([
          isManager
            ? collectAllPages((query) => api.timeEntries.list(authToken, { ...weekQuery, ...query }), weekQuery, 100)
            : collectAllPages((query) => api.timeEntries.mine(authToken, { ...weekQuery, ...query }), weekQuery, 100),
          isManager
            ? api.vacations.list(authToken, { estado: 'PENDIENTE', pageSize: 5, order: 'desc' })
            : api.vacations.mine(authToken, { pageSize: 5, order: 'desc' }),
          isManager
            ? api.permissions.list(authToken, { estado: 'PENDIENTE', pageSize: 5, order: 'desc' })
            : api.permissions.mine(authToken, { pageSize: 5, order: 'desc' }),
          isManager
            ? api.incidents.list(authToken, { resuelta: 'false', pageSize: 5, order: 'desc' })
            : api.incidents.mine(authToken, { pageSize: 5, order: 'desc' })
        ]);

        setWeeklyEntries(weekList);
        setRecentTimeEntries([...weekList].slice(-5).reverse());
        setLatestVacation(vacations.data[0] ?? null);
        setLatestPermission(permissions.data[0] ?? null);
        setLatestIncident(incidents.data[0] ?? null);

        if (isManager) {
          const [active, working, vacationPending, permissionPending, incidentOpen] = await Promise.all([
            api.employees.list(authToken, { active: 'true', pageSize: 1 }),
            api.employees.list(authToken, { working: 'true', pageSize: 1 }),
            api.vacations.list(authToken, { estado: 'PENDIENTE', pageSize: 1 }),
            api.permissions.list(authToken, { estado: 'PENDIENTE', pageSize: 1 }),
            api.incidents.list(authToken, { resuelta: 'false', pageSize: 1 })
          ]);

          setActiveEmployees(active.pagination.total);
          setWorkingNow(working.pagination.total);
          setPendingRequests(vacationPending.pagination.total + permissionPending.pagination.total);
          setOpenIncidents(incidentOpen.pagination.total);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el panel');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, weekRange.from, weekRange.to]);

  if (loading) {
    return (
      <section className="dashboard-skeleton stack">
        <div className="skeleton skeleton--line" style={{ width: '9rem' }} />
        <div className="skeleton skeleton--line" style={{ width: '20rem', height: '2.4rem' }} />
        <div className="grid-3">
          <div className="skeleton skeleton--block" />
          <div className="skeleton skeleton--block" />
          <div className="skeleton skeleton--block" />
        </div>
        <div className="skeleton skeleton--block" style={{ minHeight: '24rem' }} />
      </section>
    );
  }

  const roleLabel = getRoleLabel(sessionUser?.roles);
  const isManager = scope === 'manager';
  const companyPolicy = company?.workPolicy as Record<string, unknown> | null | undefined;
  const weeklyTargetCandidate = companyPolicy?.['weeklyTargetMinutes'];
  const weeklyTargetMinutes = typeof weeklyTargetCandidate === 'number' ? weeklyTargetCandidate : null;
  const weeklyRemainingMinutes = weeklyTargetMinutes !== null ? Math.max(0, weeklyTargetMinutes - weekSummary.workedMinutes) : null;
  const mainTitle = isManager ? `Buenos días, ${sessionUser?.nombreEmpleado ?? 'equipo'}` : `Buenos días, ${sessionUser?.nombreEmpleado ?? 'persona'}`;
  const mainDescription = isManager
    ? 'Resumen operativo de la jornada, ausencias y trabajo pendiente.'
    : 'Todo lo importante para empezar tu día con claridad.';
  const pageStats = isManager
    ? [
        { value: String(activeEmployees), label: 'Empleados activos', icon: <Users2 size={16} /> },
        { value: String(workingNow), label: 'Trabajando ahora', icon: <Clock3 size={16} /> },
        { value: String(pendingRequests), label: 'Pendientes', icon: <ShieldAlert size={16} /> }
      ]
    : [
        { value: weeklyTargetMinutes !== null ? formatDurationLabel(weeklyTargetMinutes) : '—', label: 'Objetivo semanal (min)', icon: <CalendarClock size={16} /> },
        { value: formatDurationLabel(weekSummary.workedMinutes), label: 'Tiempo trabajado (h/min)', icon: <TimerReset size={16} /> },
        { value: String(weekSummary.days), label: 'Días con actividad', icon: <CalendarClock size={16} /> },
        { value: weeklyRemainingMinutes !== null ? formatDurationLabel(weeklyRemainingMinutes) : '—', label: 'Restante (min)', icon: <Clock3 size={16} /> }
      ];

  return (
    <div className="dashboard-layout stack">
      <PageHeader
        eyebrow={isManager ? 'Gestión' : 'Tu jornada'}
        title={mainTitle}
        description={`${mainDescription} ${formatLongDate(new Date())}.`}
        actions={
          <>
            <Link className="button button-secondary" href="/time-entries">
              Ver fichajes
            </Link>
          </>
        }
        stats={pageStats.map((stat) => (
          <article className="stat stat--compact" key={stat.label}>
            <div className="stat__icon">{stat.icon}</div>
            <strong>{stat.value}</strong>
            <span className="muted">{stat.label}</span>
          </article>
        ))}
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <div className="dashboard-layout__primary">
        {token ? <WorkTimer token={token} /> : null}
        <AnalyticsChart
          title="Horas trabajadas esta semana"
          description={`Del ${formatLongDate(weekRange.from)} al ${formatLongDate(weekRange.to)}.`}
          data={chartData}
          valueLabel="Horas"
          emptyLabel="Todavía no hay suficientes fichajes para mostrar la evolución."
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel stack">
          <div className="toolbar">
            <div className="stack" style={{ gap: '0.35rem' }}>
              <span className="eyebrow">Actividad reciente</span>
              <h2 className="section-title">Últimos movimientos</h2>
            </div>
            <span className="badge badge-info">{roleLabel}</span>
          </div>

          <div className="dashboard-list">
            {recentTimeEntries.length ? (
              recentTimeEntries.map((entry) => (
                <article className="dashboard-list__item" key={entry.id}>
                  <div>
                    <strong>{timeEntryLabel(entry)}</strong>
                    <p>{entry.usuarioNombre}</p>
                  </div>
                  <span className="muted">{entry.dia}</span>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>Sin movimientos recientes</strong>
                <p className="meta">Cuando registres actividad aparecerá aquí el histórico de la semana.</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel stack">
          <div className="toolbar">
            <div className="stack" style={{ gap: '0.35rem' }}>
              <span className="eyebrow">{isManager ? 'Pendientes' : 'Próximas solicitudes'}</span>
              <h2 className="section-title">{isManager ? 'Cola de revisión' : 'Tus ausencias y permisos'}</h2>
            </div>
          </div>

          <div className="dashboard-list">
              <article className="dashboard-list__item">
                <div>
                  <strong>{isManager ? 'Vacaciones pendientes' : 'Vacaciones solicitadas'}</strong>
                  <p>{latestVacation ? `${getVacationStatusLabel(latestVacation.estado)} · ${formatLongDate(latestVacation.inicio)}` : 'Sin movimientos'}</p>
                </div>
              </article>
              <article className="dashboard-list__item">
                <div>
                  <strong>{isManager ? 'Permisos pendientes' : 'Permisos solicitados'}</strong>
                  <p>{latestPermission ? `${getPermissionStatusLabel(latestPermission.estado)} · ${formatLongDate(latestPermission.dia)}` : 'Sin movimientos'}</p>
                </div>
              </article>
            <article className="dashboard-list__item">
              <div>
                <strong>{isManager ? 'Incidencias abiertas' : 'Tus incidencias'}</strong>
                <p>{latestIncident ? `${latestIncident.resuelta ? 'Cerrada' : 'Abierta'} · ${formatLongDate(latestIncident.dia)}` : 'Sin movimientos'}</p>
              </div>
            </article>
          </div>

          {isManager ? (
            <div className="dashboard-kpis">
              <article className="stat">
                <strong>{openIncidents}</strong>
                <span className="muted">Incidencias abiertas</span>
              </article>
              <article className="stat">
                <strong>{pendingRequests}</strong>
                <span className="muted">Solicitudes por revisar</span>
              </article>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
