'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../components/page-header';
import { api, type CalendarListItem, type Company } from '../../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../../lib/auth/session';
import { formatFlexibleDurationMinutes, parseFlexibleDurationMinutes } from '../../../lib/duration';
import { getTimezoneOptions } from '../../../lib/timezones';

export default function CompanySettingsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawCompanyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const companyId = rawCompanyId ? Number(rawCompanyId) : Number.NaN;
  const session = getStoredSession();
  const [company, setCompany] = useState<Company | null>(null);
  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [timezone, setTimezone] = useState('');
  const [active, setActive] = useState(true);
  const [defaultCalendarId, setDefaultCalendarId] = useState('');
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState('');
  const [monthlyTargetMinutes, setMonthlyTargetMinutes] = useState('');
  const [maxDailyMinutes, setMaxDailyMinutes] = useState('');
  const [minimumBreakMinutes, setMinimumBreakMinutes] = useState('');
  const [expectedBreakMinutes, setExpectedBreakMinutes] = useState('');
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState('');
  const [overtimeWarningMinutes, setOvertimeWarningMinutes] = useState('');
  const [nightWorkStart, setNightWorkStart] = useState('');
  const [nightWorkEnd, setNightWorkEnd] = useState('');
  const [allowOvertime, setAllowOvertime] = useState(true);
  const [allowNightWork, setAllowNightWork] = useState(false);
  const timezoneOptions = getTimezoneOptions();

  const canManageGlobally = session?.user.roles.includes('ROLE_SUPER_ADMIN') ?? false;

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    if (Number.isNaN(companyId)) {
      setError('Empresa no válida');
      setLoading(false);
      return;
    }

    async function load(token: string) {
      try {
        const [companyResult, calendarResult] = await Promise.all([
          api.companies.byId(token, companyId),
          api.calendars.list(token)
        ]);

        setCompany(companyResult);
        setCalendars(calendarResult);
        setName(companyResult.name);
        setCode(companyResult.code);
        setTimezone(companyResult.timezone ?? '');
        setActive(companyResult.active);
        setDefaultCalendarId(companyResult.defaultCalendarId ? String(companyResult.defaultCalendarId) : '');

        const policy = (companyResult.workPolicy ?? {}) as Record<string, unknown>;
        setWeeklyTargetMinutes(formatFlexibleDurationMinutes(typeof policy.weeklyTargetMinutes === 'number' ? policy.weeklyTargetMinutes : null));
        setMonthlyTargetMinutes(formatFlexibleDurationMinutes(typeof policy.monthlyTargetMinutes === 'number' ? policy.monthlyTargetMinutes : null));
        setMaxDailyMinutes(formatFlexibleDurationMinutes(typeof policy.maxDailyMinutes === 'number' ? policy.maxDailyMinutes : null));
        setMinimumBreakMinutes(formatFlexibleDurationMinutes(typeof policy.minimumBreakMinutes === 'number' ? policy.minimumBreakMinutes : null));
        setExpectedBreakMinutes(formatFlexibleDurationMinutes(typeof policy.expectedBreakMinutes === 'number' ? policy.expectedBreakMinutes : null));
        setLateThresholdMinutes(formatFlexibleDurationMinutes(typeof policy.lateThresholdMinutes === 'number' ? policy.lateThresholdMinutes : null));
        setOvertimeWarningMinutes(formatFlexibleDurationMinutes(typeof policy.overtimeWarningMinutes === 'number' ? policy.overtimeWarningMinutes : null));
        setNightWorkStart(typeof policy.nightWorkStart === 'string' ? policy.nightWorkStart : '');
        setNightWorkEnd(typeof policy.nightWorkEnd === 'string' ? policy.nightWorkEnd : '');
        setAllowOvertime(policy.allowOvertime !== false);
        setAllowNightWork(Boolean(policy.allowNightWork));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la configuración de la empresa');
      } finally {
        setLoading(false);
      }
    }

    void load(accessToken);
  }, [companyId, router]);

  async function save() {
    const accessToken = getAccessToken();
    if (!accessToken || !company) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const workPolicy = {
        weeklyTargetMinutes: parseFlexibleDurationMinutes(weeklyTargetMinutes),
        monthlyTargetMinutes: parseFlexibleDurationMinutes(monthlyTargetMinutes),
        maxDailyMinutes: parseFlexibleDurationMinutes(maxDailyMinutes),
        minimumBreakMinutes: parseFlexibleDurationMinutes(minimumBreakMinutes),
        expectedBreakMinutes: parseFlexibleDurationMinutes(expectedBreakMinutes),
        lateThresholdMinutes: parseFlexibleDurationMinutes(lateThresholdMinutes),
        overtimeWarningMinutes: parseFlexibleDurationMinutes(overtimeWarningMinutes),
        nightWorkStart: nightWorkStart || null,
        nightWorkEnd: nightWorkEnd || null,
        allowOvertime,
        allowNightWork
      };

      const updated = await api.companies.update(accessToken, company.id, {
        name,
        code,
        timezone: timezone || null,
        active,
        defaultCalendarId: defaultCalendarId ? Number(defaultCalendarId) : null,
        workPolicy
      });

      setCompany(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(nextActive: boolean) {
    const accessToken = getAccessToken();
    if (!accessToken || !company) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await api.companies.update(accessToken, company.id, {
        name,
        code,
        timezone: timezone || null,
        active: nextActive,
        defaultCalendarId: defaultCalendarId ? Number(defaultCalendarId) : null,
        workPolicy: {
          weeklyTargetMinutes: parseFlexibleDurationMinutes(weeklyTargetMinutes),
          monthlyTargetMinutes: parseFlexibleDurationMinutes(monthlyTargetMinutes),
          maxDailyMinutes: parseFlexibleDurationMinutes(maxDailyMinutes),
          minimumBreakMinutes: parseFlexibleDurationMinutes(minimumBreakMinutes),
          expectedBreakMinutes: parseFlexibleDurationMinutes(expectedBreakMinutes),
          lateThresholdMinutes: parseFlexibleDurationMinutes(lateThresholdMinutes),
          overtimeWarningMinutes: parseFlexibleDurationMinutes(overtimeWarningMinutes),
          nightWorkStart: nightWorkStart || null,
          nightWorkEnd: nightWorkEnd || null,
          allowOvertime,
          allowNightWork
        }
      });
      setCompany(updated);
      setActive(updated.active);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'No se pudo cambiar el estado de la empresa');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Configuración</span>
        <h1>Cargando empresa...</h1>
      </section>
    );
  }

  if (!company) {
    return (
      <section className="hero">
        <span className="eyebrow">Configuración</span>
        <h1>Empresa no disponible</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow={canManageGlobally ? 'Super admin' : 'Empresa'}
        title={`Ajustes de ${company.name}`}
        description="Configura los parámetros operativos de la empresa, sus calendarios y su política laboral."
        actions={
          <>
            <Link className="button button-secondary" href="/companies">
              Volver a empresas
            </Link>
            <Link className="button button-secondary" href="/work-locations">
              Ver centros
            </Link>
            <button className="button button-secondary" type="button" onClick={() => void toggleActive(!active)} disabled={saving}>
              {active ? 'Desactivar empresa' : 'Activar empresa'}
            </button>
          </>
        }
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{company.code}</strong>
              <span className="muted">Código</span>
            </article>
            <article className="stat stat--compact">
              <strong>{company.active ? 'Activa' : 'Inactiva'}</strong>
              <span className="muted">Estado</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <form
        className="panel stack"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="toolbar">
          <div>
            <h2 className="section-title">Datos base</h2>
            <p className="meta">Información general de la empresa y calendario por defecto.</p>
          </div>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="code">Código</label>
            <input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="timezone">Zona horaria</label>
            <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="">Selecciona una zona horaria</option>
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="defaultCalendarId">Calendario por defecto</label>
            <select id="defaultCalendarId" value={defaultCalendarId} onChange={(e) => setDefaultCalendarId(e.target.value)}>
              <option value="">Sin calendario por defecto</option>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.nombre} ({calendar.year})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="active">Estado</label>
            <select id="active" value={String(active)} onChange={(e) => setActive(e.target.value === 'true')}>
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </div>
        </div>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Política laboral</h2>
            <p className="meta">Todos estos campos se guardan en minutos salvo las horas nocturnas, que se eligen como hora local.</p>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="weeklyTargetMinutes">Objetivo semanal (minutos)</label>
            <input id="weeklyTargetMinutes" type="text" inputMode="decimal" placeholder="480 o 8:00" value={weeklyTargetMinutes} onChange={(e) => setWeeklyTargetMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="monthlyTargetMinutes">Objetivo mensual (minutos)</label>
            <input id="monthlyTargetMinutes" type="text" inputMode="decimal" placeholder="8:00 o 480" value={monthlyTargetMinutes} onChange={(e) => setMonthlyTargetMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="maxDailyMinutes">Máximo diario (minutos)</label>
            <input id="maxDailyMinutes" type="text" inputMode="decimal" placeholder="8:30 o 510" value={maxDailyMinutes} onChange={(e) => setMaxDailyMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="minimumBreakMinutes">Descanso mínimo (minutos)</label>
            <input id="minimumBreakMinutes" type="text" inputMode="decimal" placeholder="30 o 0:30" value={minimumBreakMinutes} onChange={(e) => setMinimumBreakMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="expectedBreakMinutes">Descanso esperado (minutos)</label>
            <input id="expectedBreakMinutes" type="text" inputMode="decimal" placeholder="30 o 0:30" value={expectedBreakMinutes} onChange={(e) => setExpectedBreakMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="lateThresholdMinutes">Umbral de retraso (minutos)</label>
            <input id="lateThresholdMinutes" type="text" inputMode="decimal" placeholder="10 o 0:10" value={lateThresholdMinutes} onChange={(e) => setLateThresholdMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="overtimeWarningMinutes">Aviso de horas extra (minutos)</label>
            <input id="overtimeWarningMinutes" type="text" inputMode="decimal" placeholder="30 o 0:30" value={overtimeWarningMinutes} onChange={(e) => setOvertimeWarningMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="nightWorkStart">Inicio trabajo nocturno (hora)</label>
            <input id="nightWorkStart" type="time" value={nightWorkStart} onChange={(e) => setNightWorkStart(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="nightWorkEnd">Fin trabajo nocturno (hora)</label>
            <input id="nightWorkEnd" type="time" value={nightWorkEnd} onChange={(e) => setNightWorkEnd(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="allowOvertime">Horas extra</label>
            <select id="allowOvertime" value={String(allowOvertime)} onChange={(e) => setAllowOvertime(e.target.value === 'true')}>
              <option value="true">Permitidas</option>
              <option value="false">No permitidas</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="allowNightWork">Trabajo nocturno</label>
            <select id="allowNightWork" value={String(allowNightWork)} onChange={(e) => setAllowNightWork(e.target.value === 'true')}>
              <option value="true">Permitido</option>
              <option value="false">No permitido</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Accesos rápidos</h2>
            <p className="meta">Ir a centros, usuarios y otras áreas vinculadas a esta empresa.</p>
          </div>
        </div>
        <div className="hero-actions">
          <Link className="button button-secondary" href="/work-locations">
            Centros
          </Link>
          <Link className="button button-secondary" href="/employees">
            Empleados
          </Link>
          <Link className="button button-secondary" href="/users">
            Usuarios
          </Link>
        </div>
      </section>
    </div>
  );
}
