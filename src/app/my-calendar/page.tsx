'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { ScheduleGrid } from '../../components/schedule-grid';
import { api, type Schedule } from '../../lib/api/generated';
import { formatInputDate, formatLongDate } from '../../lib/labels';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';

function monthRange(date: Date) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { from: formatInputDate(from), to: formatInputDate(to) };
}

export default function MyCalendarPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        const result = await api.schedule.me(token, { from, to });
        setSchedule(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu calendario');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, from, to]);

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Mi calendario</span>
        <h1>Cargando calendario...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Empleado"
        title="Mi calendario"
        description="Consulta tu turno previsto, tus ausencias y el estado de cada día."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{session?.user.nombreEmpleado ?? '—'}</strong>
              <span className="muted">Empleado</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(from)}</strong>
              <span className="muted">Desde</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(to)}</strong>
              <span className="muted">Hasta</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="panel stack">
        <div className="field-grid">
          <div className="field">
            <label htmlFor="from">Desde</label>
            <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="to">Hasta</label>
            <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </section>

      {schedule ? <ScheduleGrid schedule={schedule} compact /> : null}
    </div>
  );
}
