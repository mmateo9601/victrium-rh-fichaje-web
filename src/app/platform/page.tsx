'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { api, type ReportsSummary } from '../../lib/api/generated';
import { formatDurationLabel, formatLongDate, formatNumber } from '../../lib/labels';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';

export default function PlatformPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const roles = getEffectiveRoles(session);
  const canAccess = roles.includes('ROLE_SUPER_ADMIN');
  const accessDenied = Boolean(session) && !canAccess;
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
      router.replace('/dashboard');
      return;
    }

    async function load() {
      try {
        const data = await api.reports.summary(authToken);
        setSummary(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la plataforma');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, canAccess]);

  if (accessDenied) {
    return null;
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Configuración</span>
        <h1>Cargando consola...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Super admin"
        title="Configuración de plataforma"
        description="Resumen operativo global de compañías, centros, planificación y actividad."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{formatNumber(summary?.companies ?? 0)}</strong>
              <span className="muted">Empresas</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatNumber(summary?.planningPeriods ?? 0)}</strong>
              <span className="muted">Periodos</span>
            </article>
            <article className="stat stat--compact">
              <strong>{formatNumber(summary?.publishedPlanningPeriods ?? 0)}</strong>
              <span className="muted">Publicados</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="grid-3">
        {[
          { label: 'Usuarios de acceso', value: summary?.users ?? 0 },
          { label: 'Empleados', value: summary?.employees ?? 0 },
          { label: 'Centros', value: summary?.workLocations ?? 0 },
          { label: 'Turnos', value: summary?.shifts ?? 0 },
          { label: 'Fichajes', value: summary?.timeEntries ?? 0 },
          { label: 'Sesiones activas', value: summary?.activeSessions ?? 0 }
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
            <h2 className="section-title">Cobertura operativa</h2>
            <p className="meta">
              {summary ? `${formatLongDate(summary.currentMonthFrom)} - ${formatLongDate(summary.currentMonthTo)}` : 'Periodo actual'}
            </p>
          </div>
        </div>
        <div className="grid-3">
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthPlannedMinutes ?? 0)}</strong>
            <span className="muted">Planificado (min)</span>
          </article>
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthWorkedMinutes ?? 0)}</strong>
            <span className="muted">Trabajado (h/min)</span>
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
            <span className="muted">Horas extra (min)</span>
          </article>
          <article className="stat">
            <strong>{formatDurationLabel(summary?.currentMonthNightWorkMinutes ?? 0)}</strong>
            <span className="muted">Trabajo nocturno (min)</span>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Accesos rápidos</h2>
            <p className="meta">Entrada directa a las áreas principales de la plataforma.</p>
          </div>
        </div>
        <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
          <Link className="button button-primary" href="/planning-periods">
            Periodos de planificación
          </Link>
          <Link className="button button-secondary" href="/work-locations">
            Centros de trabajo
          </Link>
          <Link className="button button-secondary" href="/companies">
            Empresas
          </Link>
        <Link className="button button-secondary" href="/reports">
            Informes
          </Link>
        </div>
      </section>
    </div>
  );
}
