'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { ScheduleGrid } from '../../components/schedule-grid';
import { WorkforceCalendar } from '../../components/workforce-calendar';
import { api, type Employee, type PlanningPeriod, type Schedule, type Shift, type WorkLocation } from '../../lib/api/generated';
import { getStoredSession } from '../../lib/auth/session';
import { buildScheduleEvents, type WorkforceCalendarRange } from '../../lib/calendar';
import { formatDurationLabel, formatInputDate, formatLongDate, formatNumber } from '../../lib/labels';
import { getAccessToken } from '../../lib/auth/session';

function monthRange(date: Date) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { from: formatInputDate(from), to: formatInputDate(to) };
}

export default function SchedulePage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canAccess = session?.user.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN') ?? false;
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [planningPeriodId, setPlanningPeriodId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [planningPeriods, setPlanningPeriods] = useState<PlanningPeriod[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [creatingLocationAssignment, setCreatingLocationAssignment] = useState(false);
  const [creatingOverride, setCreatingOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('');
  const [assignmentShiftId, setAssignmentShiftId] = useState('');
  const [assignmentLocationId, setAssignmentLocationId] = useState('');
  const [assignmentFrom, setAssignmentFrom] = useState(initialRange.from);
  const [assignmentTo, setAssignmentTo] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [overrideEmployeeId, setOverrideEmployeeId] = useState('');
  const [overrideShiftId, setOverrideShiftId] = useState('');
  const [overrideLocationId, setOverrideLocationId] = useState('');
  const [overrideDate, setOverrideDate] = useState(initialRange.from);
  const [overrideKind, setOverrideKind] = useState<'SHIFT' | 'OFF'>('SHIFT');
  const [overrideNotes, setOverrideNotes] = useState('');

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (!canAccess) {
      router.replace('/forbidden');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        const [employeesResult, shiftsResult, workLocationsResult, planningPeriodsResult, scheduleResult] = await Promise.all([
          api.employees.list(token, { pageSize: 100 }),
          api.shifts.list(token, { pageSize: 100 }),
          api.workLocations.list(token, { pageSize: 100, active: 'true' }),
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
        setLocations(workLocationsResult.data);
        setPlanningPeriods(planningPeriodsResult.data);
        setSchedule(scheduleResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la planificación');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, employeeId, from, shiftId, to, canAccess]);

  const scheduleEvents = useMemo(() => (schedule ? buildScheduleEvents(schedule, { showNonWorking: true }) : []), [schedule]);

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
      const [employeesResult, shiftsResult, workLocationsResult, planningPeriodsResult] = await Promise.all([
        api.employees.list(token, { pageSize: 100 }),
        api.shifts.list(token, { pageSize: 100 }),
        api.workLocations.list(token, { pageSize: 100, active: 'true' }),
        api.planningPeriods.list(token, { pageSize: 100, sort: 'startDate', order: 'desc' })
      ]);
      setEmployees(employeesResult.data);
      setShifts(shiftsResult);
      setLocations(workLocationsResult.data);
      setPlanningPeriods(planningPeriodsResult.data);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'No se pudo actualizar la planificación');
    } finally {
      setRefreshing(false);
    }
  }

  async function createAssignment() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCreatingAssignment(true);
    setError(null);
    try {
      await api.shiftAssignments.create(token, {
        employeeId: Number(assignmentEmployeeId),
        shiftId: Number(assignmentShiftId),
        validFrom: assignmentFrom,
        validTo: assignmentTo || null,
        notes: assignmentNotes || null
      });
      await refresh();
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : 'No se pudo crear la asignación');
    } finally {
      setCreatingAssignment(false);
    }
  }

  async function createLocationAssignment() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!assignmentEmployeeId || !assignmentLocationId) {
      setError('Selecciona empleado y centro');
      return;
    }

    setCreatingLocationAssignment(true);
    setError(null);
    try {
      await api.workLocations.createAssignment(token, {
        employeeId: Number(assignmentEmployeeId),
        workLocationId: Number(assignmentLocationId),
        validFrom: assignmentFrom,
        validTo: assignmentTo || null,
        notes: assignmentNotes || null
      });
      await refresh();
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'No se pudo asignar el centro');
    } finally {
      setCreatingLocationAssignment(false);
    }
  }

  async function createOverride() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCreatingOverride(true);
    setError(null);
    try {
      await api.shiftAssignments.createOverride(token, {
        employeeId: Number(overrideEmployeeId),
        shiftId: overrideKind === 'OFF' ? null : Number(overrideShiftId),
        date: overrideDate,
        kind: overrideKind,
        notes: overrideNotes || null
      });
      await refresh();
    } catch (overrideError) {
      setError(overrideError instanceof Error ? overrideError.message : 'No se pudo crear la excepción');
    } finally {
      setCreatingOverride(false);
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

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Asignación rápida</h2>
            <p className="meta">Asigna turno, periodo y centro desde una sola pantalla.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <button className="button button-secondary" type="button" onClick={() => void createLocationAssignment()} disabled={creatingLocationAssignment}>
              {creatingLocationAssignment ? 'Asignando centro...' : 'Asignar centro'}
            </button>
            <button className="button button-primary" type="button" onClick={() => void createAssignment()} disabled={creatingAssignment}>
              {creatingAssignment ? 'Asignando...' : 'Asignar turno'}
            </button>
          </div>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="assignmentEmployeeId">Empleado</label>
            <select id="assignmentEmployeeId" value={assignmentEmployeeId} onChange={(e) => setAssignmentEmployeeId(e.target.value)}>
              <option value="">Seleccionar empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.nombreEmpleado}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assignmentShiftId">Turno</label>
            <select id="assignmentShiftId" value={assignmentShiftId} onChange={(e) => setAssignmentShiftId(e.target.value)}>
              <option value="">Seleccionar turno</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} · {shift.days.find((day) => day.working)?.startTime?.slice(0, 5) ?? '—'}-{shift.days.find((day) => day.working)?.endTime?.slice(0, 5) ?? '—'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assignmentLocationId">Centro</label>
            <select id="assignmentLocationId" value={assignmentLocationId} onChange={(e) => setAssignmentLocationId(e.target.value)}>
              <option value="">Sin centro</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} · {location.city ?? location.code}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assignmentFrom">Desde</label>
            <input id="assignmentFrom" type="date" value={assignmentFrom} onChange={(e) => setAssignmentFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="assignmentTo">Hasta</label>
            <input id="assignmentTo" type="date" value={assignmentTo} onChange={(e) => setAssignmentTo(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="assignmentNotes">Notas</label>
            <input id="assignmentNotes" value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Excepción puntual</h2>
            <p className="meta">Sobrescribe un día concreto sin destruir la asignación base.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => void createOverride()} disabled={creatingOverride}>
            {creatingOverride ? 'Guardando...' : 'Crear excepción'}
          </button>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="overrideEmployeeId">Empleado</label>
            <select id="overrideEmployeeId" value={overrideEmployeeId} onChange={(e) => setOverrideEmployeeId(e.target.value)}>
              <option value="">Seleccionar empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.nombreEmpleado}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="overrideKind">Tipo</label>
            <select id="overrideKind" value={overrideKind} onChange={(e) => setOverrideKind(e.target.value as 'SHIFT' | 'OFF')}>
              <option value="SHIFT">Turno</option>
              <option value="OFF">Descanso</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="overrideShiftId">Turno excepcional</label>
            <select id="overrideShiftId" value={overrideShiftId} onChange={(e) => setOverrideShiftId(e.target.value)} disabled={overrideKind === 'OFF'}>
              <option value="">Seleccionar turno</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="overrideLocationId">Centro</label>
            <select id="overrideLocationId" value={overrideLocationId} onChange={(e) => setOverrideLocationId(e.target.value)}>
              <option value="">Sin cambio</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="overrideDate">Fecha</label>
            <input id="overrideDate" type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="overrideNotes">Notas</label>
            <input id="overrideNotes" value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} />
          </div>
        </div>
      </section>

      <WorkforceCalendar
        title="Cuadrante visual"
        description="Semana, mes o agenda para leer la planificación de equipo de un vistazo."
        events={scheduleEvents}
        loading={loading}
        emptyLabel="No hay planificación para los filtros seleccionados."
        initialView="timeGridWeek"
        initialDate={from}
        legend={[
          { label: 'Turno', tone: 'primary' },
          { label: 'Vacaciones', tone: 'info' },
          { label: 'Permiso', tone: 'warning' },
          { label: 'Festivo', tone: 'danger' }
        ]}
        onRangeChange={(nextRange: WorkforceCalendarRange) => {
          setFrom(nextRange.from);
          setTo(nextRange.to);
        }}
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
              <strong>{schedule ? formatDurationLabel(schedule.summary.plannedMinutes) : '—'}</strong>
              <span className="muted">Planificado</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatDurationLabel(schedule.summary.workedMinutes) : '—'}</strong>
              <span className="muted">Realizado</span>
            </article>
            <article className="stat stat--compact">
              <strong>{schedule ? formatNumber(schedule.summary.coverageRate) : 0}%</strong>
              <span className="muted">Cobertura</span>
            </article>
            <article className="stat stat--compact">
              <strong>{planningPeriods.length}</strong>
              <span className="muted">Periodos</span>
            </article>
          </>
        }
      />

      {schedule ? <ScheduleGrid schedule={schedule} /> : null}
    </div>
  );
}
