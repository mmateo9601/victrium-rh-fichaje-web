'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { ScheduleGrid } from '../../components/schedule-grid';
import { api, type Employee, type PlanningPeriod, type Schedule, type Shift } from '../../lib/api/generated';
import { formatInputDate, formatLongDate } from '../../lib/labels';
import { getAccessToken } from '../../lib/auth/session';

function monthRange(date: Date) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { from: formatInputDate(from), to: formatInputDate(to) };
}

export default function SchedulePage() {
  const router = useRouter();
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [planningPeriodId, setPlanningPeriodId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [planningPeriods, setPlanningPeriods] = useState<PlanningPeriod[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        const [employeesResult, shiftsResult, planningPeriodsResult, scheduleResult] = await Promise.all([
          api.employees.list(token, { pageSize: 100 }),
          api.shifts.list(token, { pageSize: 100 }),
          api.planningPeriods.list(token, { pageSize: 100, sort: 'startDate', order: 'desc' }),
          api.schedule.list(token, {
            from,
            to,
            employeeId: employeeId ? Number(employeeId) : undefined,
            shiftId: shiftId ? Number(shiftId) : undefined
          })
        ]);
        setEmployees(employeesResult.data);
        setShifts(shiftsResult);
        setPlanningPeriods(planningPeriodsResult.data);
        setSchedule(scheduleResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la planificación');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, employeeId, from, shiftId, to]);

  function selectPlanningPeriod(periodId: string) {
    setPlanningPeriodId(periodId);
    const selected = planningPeriods.find((period) => String(period.id) === periodId) ?? null;
    if (!selected) {
      return;
    }
    setFrom(selected.startDate);
    setTo(selected.endDate);
  }

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setRefreshing(true);
    try {
      const scheduleResult = await api.schedule.list(token, {
        from,
        to,
        employeeId: employeeId ? Number(employeeId) : undefined,
        shiftId: shiftId ? Number(shiftId) : undefined
      });
      setSchedule(scheduleResult);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'No se pudo actualizar la planificación');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Planificación</span>
        <h1>Cargando planificación...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title="Planificación"
        description="Consulta turnos, ausencias y cobertura por empleado y por día."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{employees.length}</strong>
              <span className="muted">Empleados</span>
            </article>
            <article className="stat stat--compact">
              <strong>{shifts.length}</strong>
              <span className="muted">Turnos</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule?.rows.length ?? 0}</strong>
              <span className="muted">Filas visibles</span>
            </article>
            <article className="stat stat--compact">
              <strong>{planningPeriods.length}</strong>
              <span className="muted">Periodos</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Filtros</h2>
            <p className="meta">
              Rango actual {formatLongDate(from)} - {formatLongDate(to)}.
            </p>
            {planningPeriodId ? (
              <p className="meta">
                Periodo seleccionado: {planningPeriods.find((period) => String(period.id) === planningPeriodId)?.name ?? 'N/A'}
              </p>
            ) : null}
          </div>
          <button className="button button-secondary" type="button" onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="planningPeriodId">Periodo de planificación</label>
            <select id="planningPeriodId" value={planningPeriodId} onChange={(e) => selectPlanningPeriod(e.target.value)}>
              <option value="">Seleccionar periodo</option>
              {planningPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} ({period.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="from">Desde</label>
            <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="to">Hasta</label>
            <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="employeeId">Empleado</label>
            <select id="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Todos</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.nombreEmpleado}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="shiftId">Turno</label>
            <select id="shiftId" value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
              <option value="">Todos</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {schedule ? <ScheduleGrid schedule={schedule} /> : null}
    </div>
  );
}
