'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { api, type ReportsSummary } from '../../lib/api/generated';
import { formatDurationLabel, formatLongDate, formatNumber } from '../../lib/labels';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';

export default function ReportsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const roles = getEffectiveRoles(session);
  const canAccess = Boolean(roles.some((role) => ['ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH'].includes(role)));
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const authToken = accessToken;
    if (!canAccess) {
      router.replace('/forbidden');
      return;
    }

    async function load() {
      try {
        const data = await api.reports.summary(authToken);
        setSummary(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los informes');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, canAccess]);

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Informes</span>
        <h1>Cargando informes...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Informes"
        title="Informes"
        description="Resumen global de actividad para dirección y administración."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{formatNumber(summary?.users ?? 0)}</strong>
              <span className="muted">Usuarios</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatNumber(summary?.employees ?? 0)}</strong>
              <span className="muted">Empleados</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatNumber(summary?.timeEntries ?? 0)}</strong>
              <span className="muted">Fichajes</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="grid-3">
        {[
          { label: 'Empresas', value: summary?.companies ?? 0 },
          { label: 'Centros', value: summary?.workLocations ?? 0 },
          { label: 'Turnos', value: summary?.shifts ?? 0 },
          { label: 'Periodos', value: summary?.planningPeriods ?? 0 },
          { label: 'Publicados', value: summary?.publishedPlanningPeriods ?? 0 },
          { label: 'Sesiones activas', value: summary?.activeSessions ?? 0 },
          { label: 'Vacaciones pendientes', value: summary?.vacationsPending ?? 0 },
          { label: 'Permisos pendientes', value: summary?.permissionsPending ?? 0 },
          { label: 'Incidencias abiertas', value: summary?.incidentsOpen ?? 0 }
        ].map((item) => (
          <article className="stat" key={item.label}>
            <strong>{formatNumber(item.value)}</strong>
            <span className="muted">{item.label}</span>
          </article>
        ))}
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Cobertura mensual</h2>
            <p className="meta">
              {summary ? `${formatLongDate(summary.currentMonthFrom)} - ${formatLongDate(summary.currentMonthTo)}` : 'Periodo actual'}
            </p>
          </div>
        </div>
        <div className="grid-3">
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthPlannedMinutes ?? 0)}</strong>
            <span className="muted">Planificado</span>
          </article>
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthWorkedMinutes ?? 0)}</strong>
            <span className="muted">Trabajado</span>
          </article>
          <article className="stat">
            <strong>{formatNumber(summary?.currentMonthCoverageRate ?? 0)}%</strong>
            <span className="muted">Cobertura</span>
          </article>
          <article className="stat">
            <strong>{formatNumber(summary?.currentMonthAbsenceDays ?? 0)}</strong>
            <span className="muted">Ausencias</span>
          </article>
          <article className="stat">
            <strong>{formatNumber(summary?.currentMonthIncidentDays ?? 0)}</strong>
            <span className="muted">Incidencias</span>
          </article>
          <article className="stat">
            <strong>{formatNumber(summary?.currentMonthUnplannedDays ?? 0)}</strong>
            <span className="muted">Días sin plan</span>
          </article>
          <article className="stat">
            <strong>{formatNumber(summary?.currentMonthPolicyWarnings ?? 0)}</strong>
            <span className="muted">Avisos de política</span>
          </article>
          <article className="stat">
            <strong>{formatNumber(summary?.currentMonthPolicyViolations ?? 0)}</strong>
            <span className="muted">Incumplimientos</span>
          </article>
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthOvertimeMinutes ?? 0)}</strong>
            <span className="muted">Horas extra</span>
          </article>
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthNightWorkMinutes ?? 0)}</strong>
            <span className="muted">Trabajo nocturno</span>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Accesos</h2>
            <p className="meta">Navegación directa para la supervisión global.</p>
          </div>
        </div>
        <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
          <Link className="button button-primary" href="/platform">
            Plataforma
          </Link>
          <Link className="button button-secondary" href="/planning-periods">
            Periodos de planificación
          </Link>
          <Link className="button button-secondary" href="/work-locations">
            Centros de trabajo
          </Link>
          <Link className="button button-secondary" href="/companies">
            Empresas
          </Link>
        </div>
      </section>
    </div>
  );
}
