'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../components/page-header';
import { api, type PlanningPeriod, type PlanningPeriodAudit } from '../../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../../lib/auth/session';
import { formatLongDate } from '../../../lib/labels';

function parseId(value: string | string[] | undefined | null) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? Number(raw) : Number.NaN;
}

export default function PlanningPeriodDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const periodId = useMemo(() => parseId(params.id), [params.id]);
  const session = useMemo(() => getStoredSession(), []);
  const canManage = Boolean(session?.user.roles.some((role) => ['ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH'].includes(role)));
  const [period, setPeriod] = useState<PlanningPeriod | null>(null);
  const [audits, setAudits] = useState<PlanningPeriodAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const authToken = accessToken;
    if (Number.isNaN(periodId)) {
      setError('Periodo no válido');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [detail, history] = await Promise.all([api.planningPeriods.byId(authToken, periodId), api.planningPeriods.audits(authToken, periodId)]);
        setPeriod(detail);
        setAudits(history);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el periodo');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [periodId, router]);

  async function refresh() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const authToken = accessToken;

    const [detail, history] = await Promise.all([api.planningPeriods.byId(authToken, periodId), api.planningPeriods.audits(authToken, periodId)]);
    setPeriod(detail);
    setAudits(history);
  }

  async function toggleStatus() {
    const accessToken = getAccessToken();
    if (!accessToken || !period) {
      return;
    }
    const authToken = accessToken;

    setWorking(true);
    setError(null);
    try {
      if (period.status === 'PUBLISHED') {
        await api.planningPeriods.unpublish(authToken, period.id);
      } else {
        await api.planningPeriods.publish(authToken, period.id);
      }
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo actualizar el periodo');
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Planificación</span>
        <h1>Cargando periodo...</h1>
      </section>
    );
  }

  if (!period) {
    return (
      <section className="hero">
        <span className="eyebrow">Planificación</span>
        <h1>Periodo no disponible</h1>
        {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Planificación"
        title={period.name}
        description="Detalle del periodo, trazabilidad de cambios y estado operativo."
        breadcrumbs={[
          { href: '/planning-periods', label: 'Periodos de planificación' },
          { href: `/planning-periods/${period.id}`, label: period.name }
        ]}
        actions={
          <>
            <Link className="button button-secondary" href="/planning-periods">
              Volver
            </Link>
            {canManage ? (
              <button className="button button-primary" type="button" onClick={() => void toggleStatus()} disabled={working}>
                {working ? 'Procesando...' : period.status === 'PUBLISHED' ? 'Volver a borrador' : 'Publicar'}
              </button>
            ) : null}
          </>
        }
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{period.companyName ?? 'Global'}</strong>
              <span className="muted">Empresa</span>
            </article>
            <article className="stat stat--compact">
              <strong>{period.version}</strong>
              <span className="muted">Versión</span>
            </article>
            <article className="stat stat--compact">
              <strong>{period.status}</strong>
              <span className="muted">Estado</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Resumen</h2>
            <p className="meta">
              {formatLongDate(period.startDate)} - {formatLongDate(period.endDate)}
            </p>
          </div>
          <span className={`badge ${period.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
            {period.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
          </span>
        </div>
        <p className="meta">{period.notes ?? 'Sin notas de planificación.'}</p>
        <div className="grid-3">
          <article className="stat">
            <strong>{period.publishedAt ? formatLongDate(period.publishedAt) : '—'}</strong>
            <span className="muted">Publicado el</span>
          </article>
          <article className="stat">
            <strong>{period.publishedByNombre ?? '—'}</strong>
            <span className="muted">Publicado por</span>
          </article>
          <article className="stat">
            <strong>{audits.length}</strong>
            <span className="muted">Eventos auditados</span>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Auditoría</h2>
            <p className="meta">Creaciones, ediciones y cambios de publicación.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Estado</th>
                <th>Versión</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <strong>{audit.action}</strong>
                  </td>
                  <td>
                    {audit.previousStatus ?? '—'} → {audit.nextStatus}
                  </td>
                  <td>
                    {audit.previousVersion ?? '—'} → {audit.nextVersion}
                  </td>
                  <td>{audit.changedByNombre ?? 'Sistema'}</td>
                  <td>{formatLongDate(audit.createdAt)}</td>
                </tr>
              ))}
              {!audits.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Sin eventos de auditoría.
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
