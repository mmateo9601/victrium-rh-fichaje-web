'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../components/page-header';
import {
  api,
  type Employee,
  type Shift,
  type ShiftAssignment,
  type ShiftOverride
} from '../../../lib/api/generated';
import { getAccessToken } from '../../../lib/auth/session';

const weekLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function minutesLabel(value: number | null) {
  if (!value) return '0 min';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours} h ${String(minutes).padStart(2, '0')} min` : `${minutes} min`;
}

export default function ShiftDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const shiftId = Number(params.id);
  const [shift, setShift] = useState<Shift | null>(null);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [overrides, setOverrides] = useState<ShiftOverride[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [overrideEmployeeId, setOverrideEmployeeId] = useState('');
  const [overrideDate, setOverrideDate] = useState(new Date().toISOString().slice(0, 10));
  const [overrideKind, setOverrideKind] = useState<'SHIFT' | 'OFF'>('SHIFT');
  const [overrideShiftId, setOverrideShiftId] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');

  const shiftDays = useMemo(() => shift?.days ?? [], [shift]);
  const totalMinutes = useMemo(() => shiftDays.reduce((acc, day) => acc + (day.workingMinutes ?? 0), 0), [shiftDays]);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        const [shiftResult, assignmentsResult, overridesResult, employeesResult] = await Promise.all([
          api.shifts.byId(token, shiftId),
          api.shifts.assignments(token, shiftId),
          api.shiftAssignments.listOverrides(token, { }),
          api.employees.list(token, { pageSize: 100 })
        ]);
        setShift(shiftResult);
        setAssignments(assignmentsResult);
        setOverrides(overridesResult.filter((item) => item.shift?.id === shiftId || item.kind === 'OFF'));
        setEmployees(employeesResult.data);
        setOverrideShiftId(String(shiftId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el turno');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, shiftId]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const [shiftResult, assignmentsResult, overridesResult] = await Promise.all([
      api.shifts.byId(token, shiftId),
      api.shifts.assignments(token, shiftId),
      api.shiftAssignments.listOverrides(token, {})
    ]);
    setShift(shiftResult);
    setAssignments(assignmentsResult);
    setOverrides(overridesResult.filter((item) => item.shift?.id === shiftId || item.kind === 'OFF'));
  }

  async function createAssignment() {
    const token = getAccessToken();
    if (!token || !employeeId) {
      return;
    }
    setActioning(true);
    setError(null);
    try {
      await api.shiftAssignments.create(token, {
        employeeId: Number(employeeId),
        shiftId,
        validFrom,
        validTo: validTo || undefined,
        notes: assignmentNotes
      });
      await refresh();
      setAssignmentNotes('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la asignación');
    } finally {
      setActioning(false);
    }
  }

  async function createOverride() {
    const token = getAccessToken();
    if (!token || !overrideEmployeeId) {
      return;
    }
    setActioning(true);
    setError(null);
    try {
      await api.shiftAssignments.createOverride(token, {
        employeeId: Number(overrideEmployeeId),
        shiftId: overrideKind === 'OFF' ? null : Number(overrideShiftId || shiftId),
        date: overrideDate,
        kind: overrideKind,
        notes: overrideNotes
      });
      await refresh();
      setOverrideNotes('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la excepción');
    } finally {
      setActioning(false);
    }
  }

  if (loading || !shift) {
    return (
      <section className="hero">
        <span className="eyebrow">Turnos</span>
        <h1>Cargando detalle...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title={shift.name}
        description={shift.description ?? 'Detalle del turno y sus asignaciones.'}
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{shift.code}</strong>
              <span className="muted">Código</span>
            </article>
            <article className="stat stat--compact">
              <strong>{minutesLabel(totalMinutes)}</strong>
              <span className="muted">Duración semanal</span>
            </article>
            <article className="stat stat--compact">
              <strong>{shift.assignmentsCount}</strong>
              <span className="muted">Asignaciones</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Horario semanal</h2>
            <p className="meta">Muestra qué ocurre cada día del ciclo semanal.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => void refresh()}>
            Recargar
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Trabaja</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Descanso</th>
                <th>Medianoche</th>
                <th>Minutos</th>
              </tr>
            </thead>
            <tbody>
              {shiftDays.map((day) => (
                <tr key={day.id}>
                  <td>{weekLabels[day.dayOfWeek]}</td>
                  <td>{day.working ? 'Sí' : 'No'}</td>
                  <td>{day.startTime?.slice(0, 5) ?? '—'}</td>
                  <td>{day.endTime?.slice(0, 5) ?? '—'}</td>
                  <td>{day.breakMinutes}</td>
                  <td>{day.crossesMidnight ? 'Sí' : 'No'}</td>
                  <td>{minutesLabel(day.workingMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2">
        <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void createAssignment(); }}>
          <h2 className="section-title">Asignar a empleado</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="employee">Empleado</label>
              <select id="employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Selecciona</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nombreEmpleado}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="validFrom">Desde</label>
              <input id="validFrom" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="validTo">Hasta</label>
              <input id="validTo" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="assignmentNotes">Notas</label>
              <input id="assignmentNotes" value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} />
            </div>
          </div>
          <button className="button button-primary" type="submit" disabled={actioning}>
            {actioning ? 'Guardando...' : 'Crear asignación'}
          </button>
        </form>

        <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void createOverride(); }}>
          <h2 className="section-title">Excepción puntual</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="overrideEmployee">Empleado</label>
              <select id="overrideEmployee" value={overrideEmployeeId} onChange={(e) => setOverrideEmployeeId(e.target.value)}>
                <option value="">Selecciona</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nombreEmpleado}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="overrideDate">Fecha</label>
              <input id="overrideDate" type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="overrideKind">Tipo</label>
              <select id="overrideKind" value={overrideKind} onChange={(e) => setOverrideKind(e.target.value as 'SHIFT' | 'OFF')}>
                <option value="SHIFT">Turno concreto</option>
                <option value="OFF">Libre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="overrideShift">Turno</label>
              <select id="overrideShift" value={overrideShiftId} onChange={(e) => setOverrideShiftId(e.target.value)} disabled={overrideKind === 'OFF'}>
                <option value="">Este turno</option>
                {shift ? <option value={shift.id}>{shift.name}</option> : null}
              </select>
            </div>
            <div className="field">
              <label htmlFor="overrideNotes">Notas</label>
              <input id="overrideNotes" value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} />
            </div>
          </div>
          <button className="button button-primary" type="submit" disabled={actioning}>
            {actioning ? 'Guardando...' : 'Crear excepción'}
          </button>
        </form>
      </div>

      <div className="grid-2">
        <section className="panel stack">
          <h2 className="section-title">Asignaciones</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Vigencia</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.employeeNombre}</td>
                    <td>
                      {assignment.validFrom} {assignment.validTo ? `- ${assignment.validTo}` : ''}
                    </td>
                    <td>{assignment.notes ?? '—'}</td>
                  </tr>
                ))}
                {!assignments.length ? (
                  <tr>
                    <td colSpan={3} className="muted">
                      Sin asignaciones.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <h2 className="section-title">Excepciones</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Turno</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((override) => (
                  <tr key={override.id}>
                    <td>{override.employeeNombre}</td>
                    <td>{override.date}</td>
                    <td>{override.kind === 'OFF' ? 'Libre' : 'Turno'}</td>
                    <td>{override.shift?.name ?? 'Libre'}</td>
                  </tr>
                ))}
                {!overrides.length ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Sin excepciones.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
