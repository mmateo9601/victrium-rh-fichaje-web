'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../../components/page-header';
import { ScheduleGrid } from '../../../../components/schedule-grid';
import { WorkforceCalendar } from '../../../../components/workforce-calendar';
import { api, type Employee, type Schedule } from '../../../../lib/api/generated';
import { getAccessToken } from '../../../../lib/auth/session';
import { buildScheduleEvents, type WorkforceCalendarRange } from '../../../../lib/calendar';
import { formatInputDate, formatLongDate, formatNumber } from '../../../../lib/labels';
import { buildFallbackEmployeeSchedule } from '../../../../lib/schedule-fallback';

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
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const employeeLabel = employee?.nombreEmpleado ?? 'Calendario del empleado';

  function setCurrentMonth() {
    setRange(initialRange);
  }

  function setTodayRange() {
    const today = formatInputDate(new Date());
    setRange({ from: today, to: today });
  }

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;
    if (Number.isNaN(employeeId)) {
      setScheduleNotice('El identificador del empleado no es válido.');
      setEmployee(null);
      setSchedule(null);
      setLoading(false);
      return;
    }

    async function load() {
      const fallbackEmployee: Employee = {
        id: employeeId,
        numero: '—',
        nombreEmpleado: `Empleado ${employeeId}`,
        email: '',
        dni: '',
        companyId: null,
        companyName: null,
        userId: null,
        diasVacaciones: null,
        horasGeneradas: null,
        working: null,
        enVacaciones: null,
        deBaja: null,
        ultimoFichaje: null,
        roles: [],
        active: true
      };

      try {
        const [employeeResult, assignmentsResult] = await Promise.all([
          api.employees.byId(token, employeeId).catch(() => null),
          api.schedule.employeeAssignments(token, employeeId).catch(() => [])
        ]);

        const uniqueShiftIds = Array.from(new Set(assignmentsResult.map((assignment) => assignment.shift.id)));
        const resolvedShifts = await Promise.all(
          uniqueShiftIds.map(async (shiftId) => {
            try {
              return await api.shifts.byId(token, shiftId);
            } catch {
              return null;
            }
          })
        );
        const shifts = resolvedShifts.filter((shift): shift is NonNullable<typeof shift> => Boolean(shift));

        setEmployee(employeeResult ?? fallbackEmployee);

        try {
          const scheduleResult = await api.schedule.employee(token, employeeId, range);
          setSchedule(scheduleResult);
          setScheduleNotice(null);
        } catch {
          setSchedule(buildFallbackEmployeeSchedule(employeeResult ?? fallbackEmployee, range, assignmentsResult, shifts));
          setScheduleNotice(
            employeeResult
              ? 'La planificación detallada no se pudo cargar, por eso se muestra una vista derivada de los turnos asignados.'
              : 'No se pudo cargar el perfil completo del empleado; se muestra una vista de respaldo.'
          );
        }
      } catch {
        setEmployee(fallbackEmployee);
        setSchedule(buildFallbackEmployeeSchedule(fallbackEmployee, range, [], []));
        setScheduleNotice('No se pudo resolver la planificación completa; se muestra una vista de respaldo.');
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
      <PageHeader
        eyebrow="Empleado"
        title={employeeLabel}
        description="Calendario individual con planificación mensual, rendimiento y contexto de actividad."
        breadcrumbs={[
          { href: '/employees', label: 'Empleados' }
        ]}
        actions={
          <>
            <Link className="button button-secondary" href={`/employees/${employeeId}`}>
              Volver al empleado
            </Link>
            <button className="button button-secondary" type="button" onClick={setTodayRange}>
              Hoy
            </button>
            <button className="button button-primary" type="button" onClick={setCurrentMonth}>
              Mes actual
            </button>
          </>
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

      {scheduleNotice ? <div className="notice notice--warning" role="status">{scheduleNotice}</div> : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Rango de consulta</h2>
            <p className="meta">Ajusta las fechas para explorar otra parte del calendario sin perder el contexto.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <button className="button button-secondary" type="button" onClick={setCurrentMonth}>
              Volver al mes actual
            </button>
          </div>
        </div>
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
      </section>

      <WorkforceCalendar
        title={employeeLabel}
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
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{formatLongDate(range.from)}</strong>
              <span className="muted">Desde</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatLongDate(range.to)}</strong>
              <span className="muted">Hasta</span>
            </article>
          </>
        }
      />

      {schedule ? <ScheduleGrid schedule={schedule} compact /> : null}
    </div>
  );
}
