'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { RotationPatternEditor, createRotationPatternStep, type RotationPatternStep } from '../../components/rotation-pattern-editor';
import { api, type Shift, type ShiftDay } from '../../lib/api/generated';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';
import { getRoleListLabel } from '../../lib/labels';
import { formatFlexibleDurationMinutes, parseFlexibleDurationMinutes } from '../../lib/duration';

const weekLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function defaultDays(): Omit<ShiftDay, 'id'>[] {
  return [
    {
      dayOfWeek: 1,
      working: true,
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakMinutes: 60,
      workingMinutes: 480,
      crossesMidnight: false,
      segments: []
    },
    {
      dayOfWeek: 2,
      working: true,
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakMinutes: 60,
      workingMinutes: 480,
      crossesMidnight: false,
      segments: []
    },
    {
      dayOfWeek: 3,
      working: true,
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakMinutes: 60,
      workingMinutes: 480,
      crossesMidnight: false,
      segments: []
    },
    {
      dayOfWeek: 4,
      working: true,
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakMinutes: 60,
      workingMinutes: 480,
      crossesMidnight: false,
      segments: []
    },
    {
      dayOfWeek: 5,
      working: true,
      startTime: '08:00:00',
      endTime: '14:00:00',
      breakMinutes: 0,
      workingMinutes: 360,
      crossesMidnight: false,
      segments: []
    },
    {
      dayOfWeek: 6,
      working: false,
      startTime: null,
      endTime: null,
      breakMinutes: 0,
      workingMinutes: 0,
      crossesMidnight: false,
      segments: []
    },
    {
      dayOfWeek: 0,
      working: false,
      startTime: null,
      endTime: null,
      breakMinutes: 0,
      workingMinutes: 0,
      crossesMidnight: false,
      segments: []
    }
  ];
}

function dayMinutes(day: ShiftDay) {
  if (day.segments.length) {
    return day.segments.reduce((total, segment) => total + (segment.workingMinutes ?? 0), 0);
  }
  return day.workingMinutes ?? 0;
}

export default function ShiftsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const roles = getEffectiveRoles(session);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [name, setName] = useState('Mañana');
  const [code, setCode] = useState('M');
  const [color, setColor] = useState('#0f766e');
  const [description, setDescription] = useState('Turno base de mañana');
  const [days, setDays] = useState<Omit<ShiftDay, 'id'>[]>(defaultDays());
  const [rotationStartDate, setRotationStartDate] = useState('');
  const [rotationPattern, setRotationPattern] = useState<RotationPatternStep[]>([
    createRotationPatternStep(),
    { ...createRotationPatternStep(), startTime: '16:00:00', endTime: '00:00:00', crossesMidnight: true },
    { ...createRotationPatternStep(), working: false, startTime: null, endTime: null, breakMinutes: 0, workingMinutes: 0, crossesMidnight: false }
  ]);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const canManage = roles.some((role) => role === 'ROLE_COMPANY_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_MANAGER');
    if (!canManage) {
      router.replace('/forbidden');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        const items = await api.shifts.list(token, { search, active });
        setShifts(items);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los turnos');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search, active, roles, session]);

  function updateDay(index: number, patch: Partial<Omit<ShiftDay, 'id'>>) {
    setDays((current) => current.map((day, currentIndex) => (currentIndex === index ? { ...day, ...patch } : day)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await api.shifts.create(token, {
        name,
        code,
        color,
        description,
        active: true,
        days,
        rotationStartDate: rotationStartDate || null,
        rotationPattern
      });
      const refreshed = await api.shifts.list(token, { search, active });
      setShifts(refreshed);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el turno');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Turnos</span>
        <h1>Cargando turnos...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title="Turnos de trabajo"
        description="Define una plantilla simple: nombre, horario semanal y patrón de rotación opcional."
        actions={
          <a className="button button-primary" href="#nuevo-turno">
            Nuevo turno
          </a>
        }
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{shifts.length}</strong>
              <span className="muted">Turnos visibles</span>
            </article>
            <article className="stat stat--compact">
              <strong>{getRoleListLabel(roles)}</strong>
              <span className="muted">Acceso actual</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <form className="panel stack" id="nuevo-turno" onSubmit={submit}>
        <div className="toolbar">
          <div>
            <h2 className="section-title">Nuevo turno</h2>
            <p className="meta">Usa horario semanal para turnos fijos y patrón de rotación solo cuando el ciclo cambia por pasos.</p>
          </div>
          <button className="button button-primary" type="submit" disabled={creating}>
            {creating ? 'Guardando...' : 'Guardar turno'}
          </button>
        </div>

        <section className="rotation-editor__section">
          <div className="toolbar">
            <div>
              <h3 className="section-title">Datos básicos</h3>
              <p className="meta">Identifica el turno sin detalles técnicos innecesarios.</p>
            </div>
            <span className="badge badge-info">Horario semanal + patrón opcional</span>
          </div>
          <div className="grid grid--2">
          <div className="field">
            <label htmlFor="name">Nombre del turno</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="code">Código corto</label>
            <input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="color">Color</label>
            <input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rotationStartDate">Fecha de inicio de rotación</label>
            <input id="rotationStartDate" type="date" value={rotationStartDate} onChange={(e) => setRotationStartDate(e.target.value)} />
          </div>
          </div>
        </section>

        <RotationPatternEditor
          value={rotationPattern}
          onChange={setRotationPattern}
          title="Patrón de rotación"
          description="Añade pasos solo si el turno cambia con el tiempo. Si el turno es fijo, deja el patrón vacío."
        />

        <section className="rotation-editor__section">
          <div className="toolbar">
            <div>
              <h3 className="section-title">Horario semanal</h3>
              <p className="meta">Completa las franjas fijas por día. Si un día no se trabaja, márcalo como no laborable.</p>
            </div>
          </div>
          <div className="stack">
            {days.map((day, index) => (
              <div className="rotation-step rotation-step--compact" key={day.dayOfWeek}>
                <div className="rotation-step__header">
                  <div>
                    <strong>{weekLabels[day.dayOfWeek]}</strong>
                    <p className="meta">{day.working ? 'Día laborable' : 'Día no laborable'}</p>
                  </div>
                  <span className={`badge ${day.working ? 'badge-success' : 'badge-neutral'}`}>{day.working ? 'Trabaja' : 'Libre'}</span>
                </div>
              <div className="field-grid">
                <div className="field">
                  <label>Día</label>
                  <div className="schedule-day__badge">{weekLabels[day.dayOfWeek]}</div>
                </div>
                <div className="field">
                  <label>Trabaja</label>
                  <select value={String(day.working)} onChange={(e) => updateDay(index, { working: e.target.value === 'true' })}>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="field">
                  <label>Inicio</label>
                  <input type="time" value={day.startTime ?? ''} onChange={(e) => updateDay(index, { startTime: e.target.value ? `${e.target.value}:00` : null })} />
                </div>
                <div className="field">
                  <label>Fin</label>
                  <input type="time" value={day.endTime ?? ''} onChange={(e) => updateDay(index, { endTime: e.target.value ? `${e.target.value}:00` : null })} />
                </div>
                <div className="field">
                  <label>Descanso</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="30 o 0:30"
                    value={formatFlexibleDurationMinutes(day.breakMinutes)}
                    onChange={(e) => updateDay(index, { breakMinutes: parseFlexibleDurationMinutes(e.target.value) ?? 0 })}
                  />
                </div>
                <div className="field">
                  <label>Min. útiles</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="480 o 8:00"
                    value={formatFlexibleDurationMinutes(day.workingMinutes)}
                    onChange={(e) => updateDay(index, { workingMinutes: parseFlexibleDurationMinutes(e.target.value) ?? 0 })}
                  />
                </div>
                <div className="field">
                  <label>Medianoche</label>
                  <select value={String(day.crossesMidnight)} onChange={(e) => updateDay(index, { crossesMidnight: e.target.value === 'true' })}>
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
              </div>
              </div>
            ))}
          </div>
        </section>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Turnos guardados</h2>
            <p className="meta">Consulta, filtra y abre cada plantilla para ajustarla más tarde.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input className="field" style={{ minWidth: '220px' }} placeholder="Buscar turno..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="field" style={{ minWidth: '140px' }} value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Horario</th>
                <th>Duración</th>
                <th>Asignaciones</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.name}</td>
                  <td>{shift.code}</td>
                  <td>
                    {shift.days
                      .filter((day) => day.working)
                      .map((day) => `${weekLabels[day.dayOfWeek]} ${day.startTime?.slice(0, 5) ?? '—'}-${day.endTime?.slice(0, 5) ?? '—'}`)
                      .join(', ')}
                  </td>
                  <td>{shift.days.reduce((acc, day) => acc + dayMinutes(day), 0)} min</td>
                  <td>{shift.assignmentsCount}</td>
                  <td>
                    <span className={`badge ${shift.active ? 'badge-success' : 'badge-danger'}`}>{shift.active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td>
                    <Link className="button button-secondary" href={`/shifts/${shift.id}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {!shifts.length ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Sin turnos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
