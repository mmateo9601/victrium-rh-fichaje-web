'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../../components/page-header';
import { ScheduleGrid } from '../../../../components/schedule-grid';
import { api, type Employee, type Schedule } from '../../../../lib/api/generated';
import { getAccessToken } from '../../../../lib/auth/session';
import { formatInputDate, formatLongDate } from '../../../../lib/labels';

function monthRange(date: Date) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { from: formatInputDate(from), to: formatInputDate(to) };
}

export default function EmployeeSchedulePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const employeeId = params.id ? Number(params.id) : Number.NaN;
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [employee, setEmployee] = useState<Employee | null>(null);
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
    if (Number.isNaN(employeeId)) {
      setError('Empleado no válido');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [employeeResult, scheduleResult] = await Promise.all([
          api.employees.byId(token, employeeId),
          api.schedule.employee(token, employeeId, { from, to })
        ]);
        setEmployee(employeeResult);
        setSchedule(scheduleResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la planificación');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [employeeId, from, router, to]);

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Empleado</span>
        <h1>Cargando calendario...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Empleado"
        title={employee?.nombreEmpleado ?? 'Calendario del empleado'}
        description="Histórico, vigencia y planificación mensual individual."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{employee?.numero ?? '—'}</strong>
              <span className="muted">Número</span>
            </article>
            <article className="stat stat--compact">
              <strong>{employee?.companyName ?? 'Global'}</strong>
              <span className="muted">Empresa</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(from)}</strong>
              <span className="muted">Desde</span>
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
