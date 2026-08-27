'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '../../components/modal';
import { api, type CalendarDay, type CalendarListItem } from '../../lib/api/generated';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';
import { buildCsv, downloadCsv } from '../../lib/csv';
import { getRoleListLabel } from '../../lib/labels';
import { formatFlexibleDurationMinutes, parseFlexibleDurationMinutes } from '../../lib/duration';

type CalendarDayForm = Omit<CalendarDay, 'id'>;

const defaultDay = (): CalendarDayForm => ({ dia: '', horaInicio: '09:00', horaFin: '17:00' });

export default function CalendarsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const roles = getEffectiveRoles(session);
  const canManage = roles.includes('ROLE_COMPANY_ADMIN') || roles.includes('ROLE_RRHH') || roles.includes('ROLE_SUPER_ADMIN');
  const accessDenied = Boolean(session) && !canManage;

  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [year, setYear] = useState('');
  const [createNombre, setCreateNombre] = useState(`Calendario ${new Date().getFullYear()}`);
  const [createYear, setCreateYear] = useState(String(new Date().getFullYear()));
  const [createMinMas, setCreateMinMas] = useState(formatFlexibleDurationMinutes(0));
  const [createMinMenos, setCreateMinMenos] = useState(formatFlexibleDurationMinutes(0));
  const [createActive, setCreateActive] = useState(false);
  const [createDays, setCreateDays] = useState<CalendarDayForm[]>([defaultDay()]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (accessDenied) {
    return null;
  }

  function openCreate() {
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!canManage) {
      router.replace('/dashboard');
      return;
    }
    const authToken: string = token;

    async function load() {
      try {
        const items = await api.calendars.listDto(authToken, { search, active, year });
        setCalendars(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Calendars');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search, active, year, canManage]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;
    const items = await api.calendars.listDto(authToken, { search, active, year });
    setCalendars(items);
  }

  function updateDay(index: number, patch: Partial<CalendarDayForm>) {
    setCreateDays((current) => current.map((day, currentIndex) => (currentIndex === index ? { ...day, ...patch } : day)));
  }

  async function submitCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    setCreating(true);
    setError(null);
    try {
      await api.calendars.create(authToken, {
        nombre: createNombre,
        year: Number(createYear),
        minutosMasEntrada: parseFlexibleDurationMinutes(createMinMas) ?? 0,
        minutosMenosEntrada: parseFlexibleDurationMinutes(createMinMenos) ?? 0,
        active: createActive,
        days: createDays
      });
      setCreateNombre(`Calendario ${new Date().getFullYear()}`);
      setCreateYear(String(new Date().getFullYear()));
      setCreateMinMas(formatFlexibleDurationMinutes(0));
      setCreateMinMenos(formatFlexibleDurationMinutes(0));
      setCreateActive(false);
      setCreateDays([defaultDay()]);
      closeCreate();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el calendario');
    } finally {
      setCreating(false);
    }
  }

  async function exportCsv() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const csv = buildCsv(
        ['Nombre', 'Año', 'Activo', 'Días'],
        calendars.map((calendar) => [
          calendar.nombre,
          calendar.year,
          calendar.active ? 'Sí' : 'No',
          calendar.daysCount
        ])
      );
      downloadCsv('calendarios.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar los calendarios');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Calendars</span>
        <h1>Cargando calendarios...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Horario laboral</span>
        <h1>Calendarios</h1>
        <p>
          Gestiona los calendarios laborales y sus días con una interfaz más clara y preparada para edición directa.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        {canManage ? (
          <div className="hero-actions" style={{ marginTop: '1rem' }}>
            <button className="button button-primary" type="button" onClick={openCreate}>
              Nuevo calendario
            </button>
          </div>
        ) : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{calendars.length}</strong>
            <span className="muted">Calendarios visibles</span>
          </article>
          <article className="stat">
            <strong>{createDays.length}</strong>
            <span className="muted">Días en borrador</span>
          </article>
          <article className="stat">
            <strong>{getRoleListLabel(roles)}</strong>
            <span className="muted">Acceso actual</span>
          </article>
        </div>
      </section>

      <Modal
        open={createOpen && canManage}
        onClose={closeCreate}
        size="xl"
        title="Nuevo calendario"
        description="Crea un calendario laboral con días y ajustes de minutos."
        actions={
          <button className="button button-primary" type="submit" form="calendar-create-form" disabled={creating}>
            {creating ? 'Guardando...' : 'Crear calendario'}
          </button>
        }
      >
        <form id="calendar-create-form" className="stack" onSubmit={submitCalendar}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={createNombre} onChange={(e) => setCreateNombre(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="year">Año</label>
              <input id="year" type="number" value={createYear} onChange={(e) => setCreateYear(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="minMas">Minutos más entrada</label>
              <input id="minMas" type="text" inputMode="decimal" placeholder="10 o 0:10" value={createMinMas} onChange={(e) => setCreateMinMas(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="minMenos">Minutos menos entrada</label>
              <input id="minMenos" type="text" inputMode="decimal" placeholder="10 o 0:10" value={createMinMenos} onChange={(e) => setCreateMinMenos(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="active">Activo</label>
              <select id="active" value={String(createActive)} onChange={(e) => setCreateActive(e.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>

          <div className="stack">
            <div className="toolbar">
              <div>
                <h3 className="section-title">Días laborables</h3>
                <p className="meta">Cada fila representa un día concreto con sus horas.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setCreateDays((current) => [...current, defaultDay()])}>
                Añadir día
              </button>
            </div>

            {createDays.map((day, index) => (
              <div className="field-grid" key={`${index}-${day.dia}`}>
                <div className="field">
                  <label>Día</label>
                  <input type="date" value={day.dia} onChange={(e) => updateDay(index, { dia: e.target.value })} />
                </div>
                <div className="field">
                  <label>Hora inicio</label>
                  <input type="time" value={day.horaInicio} onChange={(e) => updateDay(index, { horaInicio: e.target.value })} />
                </div>
                <div className="field">
                  <label>Hora fin</label>
                  <input type="time" value={day.horaFin} onChange={(e) => updateDay(index, { horaFin: e.target.value })} />
                </div>
                <div className="field">
                  <label>&nbsp;</label>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setCreateDays((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    disabled={createDays.length === 1}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

        </form>
      </Modal>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Consulta y acceso directo al detalle.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input className="field" style={{ minWidth: '220px' }} placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <input className="field" style={{ minWidth: '120px' }} placeholder="Año" value={year} onChange={(e) => setYear(e.target.value)} />
            <select className="field" style={{ minWidth: '140px' }} value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <button className="button button-secondary" type="button" onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Año</th>
                <th>Activo</th>
                <th>Días</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {calendars.map((calendar) => (
                <tr key={calendar.id}>
                  <td>{calendar.nombre}</td>
                  <td>{calendar.year}</td>
                  <td>
                    <span className={`badge ${calendar.active ? 'badge-success' : 'badge-danger'}`}>
                      {calendar.active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>{calendar.daysCount}</td>
                  <td>
                    <Link className="button button-secondary" href={`/calendars/${calendar.id}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {!calendars.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Sin calendarios.
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
