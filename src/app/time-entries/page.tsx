'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Download, Filter, Search, TimerReset } from 'lucide-react';

import { AnalyticsChart } from '../../components/analytics-chart';
import { PageHeader } from '../../components/page-header';
import { WorkTimer } from '../../components/work-timer';
import { WorkforceCalendar } from '../../components/workforce-calendar';
import { api, type TimeEntry, type WorkTimerCurrent } from '../../lib/api/generated';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';
import { useStoredSession, getAccessToken } from '../../lib/auth/session';
import { buildTimeEntryEvents } from '../../lib/calendar';
import { formatDurationLabel, formatInputDate, formatLongDate, getRoleLabel, getTimeEntryLabel } from '../../lib/labels';
import { buildWorkedDays, buildWorkedSummary } from '../../lib/time-analytics';

export default function TimeEntriesPage() {
  const router = useRouter();
  const session = useStoredSession();
  const canManage =
    session?.user.roles.includes('ROLE_ADMIN') ||
    session?.user.roles.includes('ROLE_COMPANY_ADMIN') ||
    session?.user.roles.includes('ROLE_RRHH') ||
    session?.user.roles.includes('ROLE_SUPER_ADMIN');

  const [mine, setMine] = useState<TimeEntry[]>([]);
  const [all, setAll] = useState<TimeEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([]);
  const [currentState, setCurrentState] = useState<WorkTimerCurrent | null>(null);
  const [search, setSearch] = useState('');
  const [numeroUsuario, setNumeroUsuario] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [tipo, setTipo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [clocking, setClocking] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekRange = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { from: formatInputDate(start), to: formatInputDate(today) };
  }, []);

  const weeklySummary = useMemo(() => buildWorkedSummary(weekEntries), [weekEntries]);
  const calendarEntries = useMemo(() => buildTimeEntryEvents(canManage ? all : mine), [all, canManage, mine]);
  const weeklyChart = useMemo(
    () =>
      buildWorkedDays(weekEntries, 7).map((item) => ({
        label: item.label,
        value: Math.round(item.minutes / 60)
      })),
    [weekEntries]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const [mineResult, weekList, currentResult] = await Promise.all([
          api.timeEntries.mine(authToken, { search, tipo, from, to, pageSize: 15, order: 'desc' as const }),
          collectAllPages((query) => api.timeEntries.mine(authToken, { ...weekRange, ...query, order: 'asc' }), weekRange, 100),
          api.timeEntries.current(authToken)
        ]);

        setMine(mineResult.data);
        setWeekEntries(weekList);
        setCurrentState(currentResult);

        if (canManage) {
          const allResult = await api.timeEntries.list(authToken, {
            search,
            numeroUsuario,
            nombreUsuario,
            tipo,
            from,
            to,
            pageSize: 15,
            order: 'desc' as const
          });
          setAll(allResult.data);
        } else {
          setAll([]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar los fichajes');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, canManage, search, numeroUsuario, nombreUsuario, tipo, from, to, weekRange]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    const mineResult = await api.timeEntries.mine(authToken, { search, tipo, from, to, pageSize: 15, order: 'desc' as const });
    setMine(mineResult.data);
    if (canManage) {
      const allResult = await api.timeEntries.list(authToken, {
        search,
        numeroUsuario,
        nombreUsuario,
        tipo,
        from,
        to,
        pageSize: 15,
        order: 'desc' as const
      });
      setAll(allResult.data);
    }
    const weekList = await collectAllPages((query) => api.timeEntries.mine(authToken, { ...weekRange, ...query, order: 'asc' }), weekRange, 100);
    setWeekEntries(weekList);
    setCurrentState(await api.timeEntries.current(authToken));
  }

  async function clock() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setClocking(true);
    setError(null);
    try {
      if (currentState?.state === 'NOT_STARTED' && currentState.eligibility && !currentState.eligibility.canStart) {
        setError(currentState.eligibility.message ?? 'La jornada aún no puede iniciarse');
        return;
      }
      await api.timeEntries.clock(token, { origen: 'web' });
      await refresh();
    } catch (clockError) {
      setError(clockError instanceof Error ? clockError.message : 'No se pudo registrar el fichaje');
    } finally {
      setClocking(false);
    }
  }

  async function exportMineCsv() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExportingMine(true);
    setError(null);
    try {
      const items = await collectAllPages(
        (query) => api.timeEntries.mine(token, { search, tipo, from, to, order: 'desc', ...query }),
        { search, tipo, from, to, order: 'desc' }
      );
      const csv = buildCsv(
        ['ID', 'Día', 'Hora', 'Tipo', 'Origen', 'Empleado', 'Número', 'Empresa'],
        items.map((entry) => [
          entry.id,
          entry.dia,
          entry.hora,
          entry.tipo,
          entry.origen,
          entry.usuarioNombre,
          entry.usuarioNumero,
          entry.companyName ?? 'General'
        ])
      );
      downloadCsv('fichajes-mios.csv', csv);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No se pudo exportar el histórico');
    } finally {
      setExportingMine(false);
    }
  }

  async function exportAllCsv() {
    if (!canManage) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExportingAll(true);
    setError(null);
    try {
      const items = await collectAllPages(
        (query) => api.timeEntries.list(token, { search, numeroUsuario, nombreUsuario, tipo, from, to, order: 'desc', ...query }),
        { search, numeroUsuario, nombreUsuario, tipo, from, to, order: 'desc' }
      );
      const csv = buildCsv(
        ['ID', 'Día', 'Hora', 'Tipo', 'Empleado', 'Número', 'Empresa', 'Origen'],
        items.map((entry) => [
          entry.id,
          entry.dia,
          entry.hora,
          entry.tipo,
          entry.usuarioNombre,
          entry.usuarioNumero,
          entry.companyName ?? 'General',
          entry.origen
        ])
      );
      downloadCsv('fichajes-equipo.csv', csv);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No se pudo exportar el histórico');
    } finally {
      setExportingAll(false);
    }
  }

  if (loading) {
    return (
      <section className="dashboard-skeleton stack">
        <div className="skeleton skeleton--line" style={{ width: '8rem' }} />
        <div className="skeleton skeleton--line" style={{ width: '18rem', height: '2.4rem' }} />
        <div className="skeleton skeleton--block" style={{ minHeight: '24rem' }} />
      </section>
    );
  }

  const roleLabel = getRoleLabel(session?.user.roles);
  const canClockNow =
    currentState === null
      ? true
      : currentState.state === 'NOT_STARTED'
        ? Boolean(currentState.eligibility?.canStart)
        : currentState.state === 'WORKING' || currentState.state === 'PAUSED';

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Histórico"
        title="Fichajes"
        description="Consulta tu jornada, filtra por fechas y revisa la evolución semanal de horas."
        actions={
          <>
            <button className="button button-secondary" type="button" onClick={exportMineCsv} disabled={exportingMine}>
              <Download size={16} />
              {exportingMine ? 'Exportando...' : 'Exportar míos'}
            </button>
            {canManage ? (
              <button className="button button-primary" type="button" onClick={exportAllCsv} disabled={exportingAll}>
                <Download size={16} />
                {exportingAll ? 'Exportando...' : 'Exportar equipo'}
              </button>
            ) : null}
          </>
        }
        stats={[
          <article className="stat stat--compact" key="mine">
            <div className="stat__icon">
              <TimerReset size={16} />
            </div>
            <strong>{formatDurationLabel(weeklySummary.workedMinutes)}</strong>
            <span className="muted">Horas esta semana</span>
          </article>,
          <article className="stat stat--compact" key="entries">
            <div className="stat__icon">
              <Clock3 size={16} />
            </div>
            <strong>{weeklySummary.entries}</strong>
            <span className="muted">Fichajes en 7 días</span>
          </article>,
          <article className="stat stat--compact" key="role">
            <div className="stat__icon">
              <Filter size={16} />
            </div>
            <strong>{roleLabel}</strong>
            <span className="muted">Acceso actual</span>
          </article>
        ]}
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      {session ? (
        <div className="time-entries-layout">
          <section className="time-entries-layout__timer">
            <WorkTimer token={getAccessToken() ?? ''} />
          </section>

          <AnalyticsChart
            title="Horas de la semana"
            description={`Del ${formatLongDate(weekRange.from)} al ${formatLongDate(weekRange.to)}.`}
            data={weeklyChart}
            valueLabel="Horas"
            emptyLabel="No hay actividad suficiente para construir la evolución semanal."
          />
        </div>
      ) : null}

      <WorkforceCalendar
        title="Calendario de fichajes"
        description="Vista visual de entradas y salidas para leer la actividad diaria sin perder la tabla."
        events={calendarEntries}
        loading={loading}
        emptyLabel="No hay fichajes para mostrar con los filtros activos."
        initialView="listMonth"
        legend={[
          { label: 'Entrada', tone: 'success' },
          { label: 'Salida', tone: 'warning' }
        ]}
        compact
      />

      <section className="panel stack">
        <div className="toolbar">
          <div className="stack" style={{ gap: '0.35rem' }}>
            <span className="eyebrow">Filtros</span>
            <h2 className="section-title">Búsqueda y fechas</h2>
          </div>
          <button
            className="button button-ghost"
            type="button"
            onClick={clock}
            disabled={clocking || !canClockNow}
            title={!canClockNow ? currentState?.eligibility?.message ?? 'La jornada aún no puede iniciarse' : undefined}
          >
            <TimerReset size={16} />
            {clocking ? 'Registrando...' : 'Marcar entrada/salida'}
          </button>
        </div>

        <div className="filters-bar">
          <label className="field">
            <span>Buscar</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input placeholder="Empleado, número o origen" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </label>
          <label className="field">
            <span>Tipo</span>
            <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </label>
          <label className="field">
            <span>Desde</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div className="stack" style={{ gap: '0.35rem' }}>
            <span className="eyebrow">Mis fichajes</span>
            <h2 className="section-title">Histórico personal</h2>
          </div>
          <Link className="button button-secondary" href="/dashboard">
            Ir al inicio
          </Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatLongDate(entry.dia)}</td>
                  <td>{entry.hora.slice(0, 5)}</td>
                  <td>
                    <span className={`badge ${entry.tipo === 'ENTRADA' ? 'badge-success' : 'badge-warning'}`}>
                      {getTimeEntryLabel(entry.tipo)}
                    </span>
                  </td>
                  <td>{entry.origen}</td>
                  <td>
                    <Link className="button button-secondary" href={`/time-entries/${entry.id}`}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {!mine.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No hay fichajes para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {canManage ? (
        <section className="panel stack">
          <div className="toolbar">
            <div className="stack" style={{ gap: '0.35rem' }}>
              <span className="eyebrow">Equipo</span>
              <h2 className="section-title">Histórico general</h2>
            </div>
            <div className="filters-bar filters-bar--inline">
              <label className="field">
                <span>Número</span>
                <input value={numeroUsuario} onChange={(event) => setNumeroUsuario(event.target.value)} placeholder="EMP001" />
              </label>
              <label className="field">
                <span>Nombre</span>
                <input value={nombreUsuario} onChange={(event) => setNombreUsuario(event.target.value)} placeholder="Nombre empleado" />
              </label>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Empleado</th>
                  <th>Número</th>
                  <th>Empresa</th>
                  <th>Origen</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {all.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatLongDate(entry.dia)}</td>
                    <td>{entry.hora.slice(0, 5)}</td>
                    <td>
                      <span className={`badge ${entry.tipo === 'ENTRADA' ? 'badge-success' : 'badge-warning'}`}>
                        {getTimeEntryLabel(entry.tipo)}
                      </span>
                    </td>
                    <td>{entry.usuarioNombre}</td>
                    <td>{entry.usuarioNumero}</td>
                    <td>{entry.companyName ?? 'General'}</td>
                    <td>{entry.origen}</td>
                    <td>
                      <Link className="button button-secondary" href={`/time-entries/${entry.id}`}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {!all.length ? (
                  <tr>
                    <td colSpan={8} className="muted">
                      No hay fichajes que revisar con los filtros activos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
