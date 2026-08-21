'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { api, type PlanningPeriod, type PlanningPeriodStatus } from '../../lib/api/generated';
import { formatLongDate } from '../../lib/labels';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';

export default function PlanningPeriodsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canManage = session?.user.roles.includes('ROLE_ADMIN') || session?.user.roles.includes('ROLE_COMPANY_ADMIN') || session?.user.roles.includes('ROLE_RRHH') || session?.user.roles.includes('ROLE_SUPER_ADMIN');
  const [periods, setPeriods] = useState<PlanningPeriod[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PlanningPeriodStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState(session?.user.companyId ? String(session.user.companyId) : '');
  const [name, setName] = useState(`Planificación ${new Date().getFullYear()}`);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('Periodo de planificación inicial');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const items = await api.planningPeriods.list(authToken, { pageSize: 100, search, status, sort: 'startDate', order: 'desc' });
        setPeriods(items.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los periodos');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search, status]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const items = await api.planningPeriods.list(token, { pageSize: 100, search, status, sort: 'startDate', order: 'desc' });
    setPeriods(items.data);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.planningPeriods.create(token, {
        companyId: companyId ? Number(companyId) : undefined,
        name,
        startDate,
        endDate,
        notes
      });
      await refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el periodo');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(period: PlanningPeriod) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setWorkingId(period.id);
    setError(null);
    try {
      if (period.status === 'PUBLISHED') {
        await api.planningPeriods.unpublish(token, period.id);
      } else {
        await api.planningPeriods.publish(token, period.id);
      }
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo actualizar el periodo');
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Planificación</span>
        <h1>Cargando periodos...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title="Periodos de planificación"
        description="Agrupa los turnos por ventana de trabajo y publica o revierte el estado del periodo."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{periods.length}</strong>
              <span className="muted">Periodos visibles</span>
            </article>
            <article className="stat stat--compact">
              <strong>{periods.filter((period) => period.status === 'PUBLISHED').length}</strong>
              <span className="muted">Publicados</span>
            </article>
            <article className="stat stat--compact">
              <strong>{session?.user.roles.join(', ') || 'Empleado'}</strong>
              <span className="muted">Acceso actual</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      {canManage ? (
        <form className="panel stack" onSubmit={submit}>
          <div className="toolbar">
            <div>
              <h2 className="section-title">Nuevo periodo</h2>
              <p className="meta">Crea una ventana de planificación antes de publicarla.</p>
            </div>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear periodo'}
            </button>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="companyId">Empresa</label>
              <input id="companyId" value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="startDate">Inicio</label>
              <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="endDate">Fin</label>
              <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes">Notas</label>
            <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </form>
      ) : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Borradores y periodos ya publicados.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input className="field" style={{ minWidth: '220px' }} placeholder="Buscar periodo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="field" style={{ minWidth: '160px' }} value={status} onChange={(e) => setStatus(e.target.value as PlanningPeriodStatus | '')}>
              <option value="">Todos</option>
              <option value="DRAFT">Borradores</option>
              <option value="PUBLISHED">Publicados</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Rango</th>
                <th>Estado</th>
                <th>Versión</th>
                <th>Publicado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id}>
                  <td>
                    <div className="stack" style={{ gap: '0.2rem' }}>
                      <strong>{period.name}</strong>
                      <span className="muted">{period.notes || 'Sin notas'}</span>
                    </div>
                  </td>
                  <td>{period.companyName ?? 'N/A'}</td>
                  <td>
                    {formatLongDate(period.startDate)} - {formatLongDate(period.endDate)}
                  </td>
                  <td>
                    <span className={`badge ${period.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
                      {period.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td>{period.version}</td>
                  <td>{period.publishedAt ? formatLongDate(period.publishedAt) : 'Sin publicar'}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => void toggleStatus(period)}
                      disabled={workingId === period.id}
                    >
                      {workingId === period.id ? 'Procesando...' : period.status === 'PUBLISHED' ? 'Volver a borrador' : 'Publicar'}
                    </button>
                  </td>
                </tr>
              ))}
              {!periods.length ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Sin periodos de planificación.
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
