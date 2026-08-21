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

function dayMinutes(day: Omit<Shift['days'][number], 'id'>) {
  if (day.segments.length) {
    return day.segments.reduce((total, segment) => total + (segment.workingMinutes ?? 0), 0);
  }
  return day.workingMinutes ?? 0;
}

function rotationMinutes(step: Shift['rotationPattern'][number]) {
  return step.workingMinutes ?? 0;
}

export default function ShiftDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const shiftId = Number(params.id);
  const [shift, setShift] = useState<Shift | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0f766e');
  const [active, setActive] = useState(true);
  const [rotationStartDate, setRotationStartDate] = useState('');
  const [days, setDays] = useState<Omit<Shift['days'][number], 'id'>[]>([]);
  const [rotationPattern, setRotationPattern] = useState('');
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [overrides, setOverrides] = useState<ShiftOverride[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const totalMinutes = useMemo(() => days.reduce((acc, day) => acc + dayMinutes(day), 0), [days]);
  const rotationMinutesTotal = useMemo(() => shift?.rotationPattern.reduce((acc, step) => acc + rotationMinutes(step), 0) ?? 0, [shift]);

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
        setName(shiftResult.name);
        setCode(shiftResult.code);
        setDescription(shiftResult.description ?? '');
        setColor(shiftResult.color ?? '#0f766e');
        setActive(shiftResult.active);
        setRotationStartDate(shiftResult.rotationStartDate ?? '');
        setDays(shiftResult.days.map(({ id: _id, ...day }) => day));
        setRotationPattern(JSON.stringify(shiftResult.rotationPattern.map(({ id: _id, ...step }) => step), null, 2));
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

  async function saveShift() {
    const token = getAccessToken();
    if (!token || !shift) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const parsedRotation = rotationPattern.trim()
        ? (JSON.parse(rotationPattern) as Array<{
            working: boolean;
            startTime: string | null;
            endTime: string | null;
            breakMinutes: number;
            workingMinutes: number | null;
            crossesMidnight: boolean;
          }>)
        : [];
      const updated = await api.shifts.update(token, shift.id, {
        name,
        code,
        description: description || null,
        color: color || null,
        active,
        rotationStartDate: rotationStartDate || null,
        days,
        rotationPattern: parsedRotation
      });
      setShift(updated);
      setDays(updated.days.map(({ id: _id, ...day }) => day));
      setRotationPattern(JSON.stringify(updated.rotationPattern.map(({ id: _id, ...step }) => step), null, 2));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el turno');
    } finally {
      setSaving(false);
    }
  }

  async function setShiftStatus(nextActive: boolean) {
    const token = getAccessToken();
    if (!token || !shift) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = nextActive
        ? await api.shifts.activate(token, shift.id)
        : await api.shifts.deactivate(token, shift.id);
      setShift(updated);
      setActive(updated.active);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo cambiar el estado');
    } finally {
      setSaving(false);
    }
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
            <article className="stat stat--compact">
              <strong>{shift.rotationPattern.length ? shift.rotationPattern.length : 'Semanal'}</strong>
              <span className="muted">Rotación</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void saveShift(); }}>
        <div className="toolbar">
          <div>
            <h2 className="section-title">Editar turno</h2>
            <p className="meta">Ajusta nombre, color, estado y horario semanal del turno.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <button className="button button-secondary" type="button" onClick={() => void setShiftStatus(true)} disabled={saving}>
              Activar
            </button>
            <button className="button button-secondary" type="button" onClick={() => void setShiftStatus(false)} disabled={saving}>
              Desactivar
            </button>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="shiftName">Nombre</label>
            <input id="shiftName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="shiftCode">Código</label>
            <input id="shiftCode" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="shiftColor">Color</label>
            <input id="shiftColor" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="shiftDescription">Descripción</label>
            <input id="shiftDescription" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="shiftRotationStartDate">Inicio rotación</label>
            <input id="shiftRotationStartDate" type="date" value={rotationStartDate} onChange={(e) => setRotationStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="shiftActive">Estado</label>
            <select id="shiftActive" value={String(active)} onChange={(e) => setActive(e.target.value === 'true')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="shiftRotationPattern">Patrón de rotación JSON</label>
          <textarea
            id="shiftRotationPattern"
            rows={8}
            value={rotationPattern}
            onChange={(e) => setRotationPattern(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="stack">
          {days.map((day, index) => (
            <div className="field-grid" key={day.dayOfWeek}>
              <div className="field">
                <label>Día</label>
                <div className="schedule-day__badge">{weekLabels[day.dayOfWeek]}</div>
              </div>
              <div className="field">
                <label>Trabaja</label>
                <select value={String(day.working)} onChange={(e) => setDays((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, working: e.target.value === 'true' } : item)))}>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="field">
                <label>Inicio</label>
                <input type="time" value={day.startTime ?? ''} onChange={(e) => setDays((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, startTime: e.target.value ? `${e.target.value}:00` : null } : item)))} />
              </div>
              <div className="field">
                <label>Fin</label>
                <input type="time" value={day.endTime ?? ''} onChange={(e) => setDays((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, endTime: e.target.value ? `${e.target.value}:00` : null } : item)))} />
              </div>
              <div className="field">
                <label>Descanso</label>
                <input type="number" value={day.breakMinutes} onChange={(e) => setDays((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, breakMinutes: Number(e.target.value) } : item)))} />
              </div>
              <div className="field">
                <label>Min. útiles</label>
                <input type="number" value={day.workingMinutes ?? 0} onChange={(e) => setDays((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, workingMinutes: Number(e.target.value) } : item)))} />
              </div>
              <div className="field">
                <label>Medianoche</label>
                <select value={String(day.crossesMidnight)} onChange={(e) => setDays((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, crossesMidnight: e.target.value === 'true' } : item)))}>
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

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
                <th>Segmentos</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.dayOfWeek}>
                  <td>{weekLabels[day.dayOfWeek]}</td>
                  <td>{day.working ? 'Sí' : 'No'}</td>
                  <td>{day.startTime?.slice(0, 5) ?? '—'}</td>
                  <td>{day.endTime?.slice(0, 5) ?? '—'}</td>
                  <td>{day.breakMinutes}</td>
                  <td>{day.crossesMidnight ? 'Sí' : 'No'}</td>
                  <td>{minutesLabel(dayMinutes(day))}</td>
                  <td>
                    {day.segments.length ? (
                      <div className="stack" style={{ gap: '0.25rem' }}>
                        {day.segments.map((segment, index) => (
                          <span key={`${day.dayOfWeek}-${index}`} className="meta">
                            {segment.startTime?.slice(0, 5) ?? '—'} - {segment.endTime?.slice(0, 5) ?? '—'} · {minutesLabel(segment.workingMinutes)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Rotación</h2>
            <p className="meta">Si existe un patrón rotativo, se aplica sobre la fecha de inicio configurada.</p>
          </div>
        </div>
        {shift.rotationPattern.length ? (
          <>
            <div className="grid-3">
              <article className="stat">
                <strong>{shift.rotationStartDate ?? '—'}</strong>
                <span className="muted">Inicio</span>
              </article>
              <article className="stat">
                <strong>{minutesLabel(rotationMinutesTotal)}</strong>
                <span className="muted">Total ciclo</span>
              </article>
              <article className="stat">
                <strong>{shift.rotationPattern.length}</strong>
                <span className="muted">Pasos</span>
              </article>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Paso</th>
                    <th>Trabaja</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Descanso</th>
                    <th>Medianoche</th>
                    <th>Minutos</th>
                  </tr>
                </thead>
                <tbody>
              {shift.rotationPattern.map((step) => (
                    <tr key={step.id}>
                      <td>{step.id}</td>
                      <td>{step.working ? 'Sí' : 'No'}</td>
                      <td>{step.startTime?.slice(0, 5) ?? '—'}</td>
                      <td>{step.endTime?.slice(0, 5) ?? '—'}</td>
                      <td>{step.breakMinutes}</td>
                      <td>{step.crossesMidnight ? 'Sí' : 'No'}</td>
                      <td>{minutesLabel(step.workingMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>Sin rotación</strong>
            <p className="meta">Este turno usa exclusivamente el horario semanal.</p>
          </div>
        )}
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
