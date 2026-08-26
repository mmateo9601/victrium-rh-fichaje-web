'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ScheduleGrid } from '../../components/schedule-grid';
import { WorkforceCalendar } from '../../components/workforce-calendar';
import { api, type Schedule } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
import { buildScheduleEvents, type WorkforceCalendarRange } from '../../lib/calendar';
import { formatDurationLabel, formatInputDate, formatLongDate, formatNumber } from '../../lib/labels';

function monthRange(date: Date) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { from: formatInputDate(from), to: formatInputDate(to) };
}

export default function MyCalendarPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [range, setRange] = useState<WorkforceCalendarRange>(initialRange);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        setNotice(null);
        const result = await api.schedule.me(token, range);
        setSchedule(result);
      } catch (loadError) {
        setSchedule(null);
        setNotice(
          loadError instanceof Error && loadError.message !== 'Unexpected error'
            ? loadError.message
            : 'No hay planificación disponible para este periodo.'
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [range.from, range.to, router, session?.user.employeeId]);

  const events = useMemo(() => (schedule ? buildScheduleEvents(schedule, { showNonWorking: true }) : []), [schedule]);

  return (
    <div className="stack">
      {notice ? <div className="notice notice--soft" role="status">{notice}</div> : null}

      <WorkforceCalendar
        title="Mi calendario"
        description="Consulta tu turno previsto, tus ausencias y el estado de cada día."
        events={events}
        loading={loading}
        emptyLabel="No tienes turnos planificados para este periodo."
        initialView="timeGridWeek"
        initialDate={range.from}
        legend={[
          { label: 'Turno', tone: 'primary' },
          { label: 'Vacaciones', tone: 'info' },
          { label: 'Permiso', tone: 'warning' },
          { label: 'Festivo', tone: 'danger' }
        ]}
        filters={
          <div className="field-grid">
            <div className="field">
              <label htmlFor="from">Desde</label>
              <input id="from" type="date" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="to">Hasta</label>
              <input id="to" type="date" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} />
            </div>
          </div>
        }
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{session?.user.nombreEmpleado ?? '—'}</strong>
              <span className="muted">Empleado</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(range.from)}</strong>
              <span className="muted">Desde</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(range.to)}</strong>
              <span className="muted">Hasta</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatDurationLabel(schedule.summary.targetMinutes ?? 0) : '—'}</strong>
              <span className="muted">Objetivo</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatDurationLabel(schedule.summary.workedMinutes) : '—'}</strong>
              <span className="muted">Realizado</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatNumber(schedule.summary.coverageRate) : 0}%</strong>
              <span className="muted">Cobertura</span>
            </article>
          </>
        }
      />

      {schedule ? <ScheduleGrid schedule={schedule} compact /> : null}
    </div>
  );
}
