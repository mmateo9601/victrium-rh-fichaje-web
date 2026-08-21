'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { ScheduleGrid } from '../../../../components/schedule-grid';
import { WorkforceCalendar } from '../../../../components/workforce-calendar';
import { api, type Employee, type Schedule } from '../../../../lib/api/generated';
import { getAccessToken } from '../../../../lib/auth/session';
import { buildScheduleEvents, type WorkforceCalendarRange } from '../../../../lib/calendar';
import { formatInputDate, formatLongDate, formatNumber } from '../../../../lib/labels';

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
  const [range, setRange] = useState<WorkforceCalendarRange>(initialRange);
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
          api.schedule.employee(token, employeeId, range)
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
  }, [employeeId, range.from, range.to, router]);

  const events = useMemo(() => (schedule ? buildScheduleEvents(schedule, { employeeId, showNonWorking: true }) : []), [employeeId, schedule]);

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
      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <WorkforceCalendar
        title={employee?.nombreEmpleado ?? 'Calendario del empleado'}
        description="Histórico, vigencia y planificación mensual individual."
        events={events}
        loading={loading}
        emptyLabel="No hay planificación para este empleado en el rango seleccionado."
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
              <input id="from" type="date" value={range.from} onChange={(e) => setRange((current) => ({ ...current, from: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="to">Hasta</label>
              <input id="to" type="date" value={range.to} onChange={(e) => setRange((current) => ({ ...current, to: e.target.value }))} />
            </div>
          </div>
        }
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
              <strong>{formatLongDate(range.from)}</strong>
              <span className="muted">Desde</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(range.to)}</strong>
              <span className="muted">Hasta</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatNumber(schedule.summary.plannedDays) : 0}</strong>
              <span className="muted">Días planificados</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatNumber(schedule.summary.workedDays) : 0}</strong>
              <span className="muted">Días con actividad</span>
            </article>
          </>
        }
      />

      {schedule ? <ScheduleGrid schedule={schedule} compact /> : null}
    </div>
  );
}
