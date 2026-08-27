'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Modal } from '../../../components/modal';
import { WorkforceCalendar } from '../../../components/workforce-calendar';
import { api, type Calendar, type CalendarDay } from '../../../lib/api/generated';
import { buildCalendarEvents } from '../../../lib/calendar';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../../lib/auth/session';
import { formatFlexibleDurationMinutes, parseFlexibleDurationMinutes } from '../../../lib/duration';

type CalendarDayForm = Omit<CalendarDay, 'id'>;

export default function CalendarDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const session = useMemo(() => getStoredSession(), []);
  const roles = getEffectiveRoles(session);
  const canManage =
    roles.includes('ROLE_COMPANY_ADMIN') ||
    roles.includes('ROLE_RRHH') ||
    roles.includes('ROLE_SUPER_ADMIN');
  const accessDenied = Boolean(session) && !canManage;
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [minMas, setMinMas] = useState(formatFlexibleDurationMinutes(0));
  const [minMenos, setMinMenos] = useState(formatFlexibleDurationMinutes(0));
  const [active, setActive] = useState(false);
  const [days, setDays] = useState<CalendarDayForm[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openEdit() {
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
  }

  if (accessDenied) {
    return null;
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
        const calendarId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
        if (!calendarId) {
          throw new Error('Identificador de calendario inválido');
        }
        const item = await api.calendars.byId(authToken, Number(calendarId));
        setCalendar(item);
        setName(item.nombre);
        setYear(String(item.year));
        setMinMas(formatFlexibleDurationMinutes(item.minutosMasEntrada));
        setMinMenos(formatFlexibleDurationMinutes(item.minutosMenosEntrada));
        setActive(item.active);
        setDays(item.days.map((day) => ({ dia: day.dia, horaInicio: day.horaInicio, horaFin: day.horaFin })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el calendario');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id, router, canManage]);

  function updateDay(index: number, patch: Partial<CalendarDayForm>) {
    setDays((current) => current.map((day, currentIndex) => (currentIndex === index ? { ...day, ...patch } : day)));
  }

  async function save() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;
    const calendarId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    if (!calendarId) {
      setError('Identificador de calendario inválido');
      return;
    }

    setSaving(true);
    setError(null);
      try {
        await api.calendars.update(authToken, Number(calendarId), {
          nombre: name,
        year: Number(year),
        minutosMasEntrada: parseFlexibleDurationMinutes(minMas) ?? 0,
        minutosMenosEntrada: parseFlexibleDurationMinutes(minMenos) ?? 0,
        active,
          days
        });
        const refreshed = await api.calendars.byId(authToken, Number(calendarId));
        setCalendar(refreshed);
        setName(refreshed.nombre);
        setYear(String(refreshed.year));
        setMinMas(formatFlexibleDurationMinutes(refreshed.minutosMasEntrada));
      setMinMenos(formatFlexibleDurationMinutes(refreshed.minutosMenosEntrada));
      setActive(refreshed.active);
      setDays(refreshed.days.map((day) => ({ dia: day.dia, horaInicio: day.horaInicio, horaFin: day.horaFin })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el calendario');
    } finally {
      setSaving(false);
    }
  }

  const calendarEvents = useMemo(() => (calendar ? buildCalendarEvents(calendar) : []), [calendar]);

  async function remove() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;
    const calendarId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    if (!calendarId) {
      setError('Identificador de calendario inválido');
      return;
    }

    if (!window.confirm('¿Eliminar este calendario?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.calendars.delete(authToken, Number(calendarId));
      router.push('/calendars');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el calendario');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Calendarios</span>
        <h1>Cargando detalle...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Detalle</span>
        <h1>{name || 'Calendario'}</h1>
        <p>
          Edita el calendario y sus días laborables desde una vista clara y directa.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        {canManage ? (
          <div className="hero-actions" style={{ marginTop: '1rem' }}>
            <button className="button button-primary" type="button" onClick={openEdit}>
              Editar calendario
            </button>
          </div>
        ) : null}
      </section>

      <WorkforceCalendar
        title="Vista laboral"
        description="Visualización anual del calendario para revisar festivos y días laborables."
        events={calendarEvents}
        loading={loading}
        emptyLabel="Este calendario todavía no tiene días configurados."
        initialView="multiMonthYear"
        compact={false}
        legend={[
          { label: 'Laborable', tone: 'primary' },
          { label: 'Festivo', tone: 'danger' }
        ]}
      />

      <Modal
        open={editOpen && canManage}
        onClose={closeEdit}
        size="xl"
        title="Editar calendario"
        description="Ajusta el nombre, los minutos de cortesía y los días laborables."
        actions={
          <>
            <button className="button button-secondary" type="button" onClick={closeEdit}>
              Cancelar
            </button>
            <button className="button button-danger" type="button" onClick={() => void remove()} disabled={saving}>
              Eliminar calendario
            </button>
            <button className="button button-primary" type="button" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="year">Año</label>
            <input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="minMas">Minutos más entrada</label>
            <input id="minMas" type="text" inputMode="decimal" placeholder="10 o 0:10" value={minMas} onChange={(e) => setMinMas(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="minMenos">Minutos menos entrada</label>
            <input id="minMenos" type="text" inputMode="decimal" placeholder="10 o 0:10" value={minMenos} onChange={(e) => setMinMenos(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="active">Activo</label>
            <select id="active" value={String(active)} onChange={(e) => setActive(e.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>

        <div className="stack">
          <div className="toolbar">
            <div>
              <h3 className="section-title">Días laborables</h3>
              <p className="meta">Reemplazo completo al guardar, siguiendo el modelo del legado.</p>
            </div>
            <button className="button button-secondary" type="button" onClick={() => setDays((current) => [...current, { dia: '', horaInicio: '09:00', horaFin: '17:00' }])}>
              Añadir día
            </button>
          </div>

          {days.map((day, index) => (
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
                  onClick={() => setDays((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  disabled={days.length === 1}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
