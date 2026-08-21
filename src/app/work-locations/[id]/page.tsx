'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../components/page-header';
import { api, type EmployeeLocationAssignment, type WorkLocation } from '../../../lib/api/generated';
import { getAccessToken } from '../../../lib/auth/session';
import { formatLongDate } from '../../../lib/labels';

function parseId(value: string | string[] | undefined | null) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return Number.NaN;
  }
  return Number(raw);
}

export default function WorkLocationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const locationId = useMemo(() => parseId(params.id), [params.id]);
  const [location, setLocation] = useState<WorkLocation | null>(null);
  const [assignments, setAssignments] = useState<EmployeeLocationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;
    if (Number.isNaN(locationId)) {
      setError('Centro no válido');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [locationResult, assignmentsResult] = await Promise.all([
          api.workLocations.byId(token, locationId),
          api.workLocations.employees(token, locationId)
        ]);
        setLocation(locationResult);
        setAssignments(assignmentsResult.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el centro');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [locationId, router]);

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Centros</span>
        <h1>Cargando centro...</h1>
      </section>
    );
  }

  if (!location) {
    return (
      <section className="hero">
        <span className="eyebrow">Centros</span>
        <h1>Centro no disponible</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title={location.name}
        description="Centro de trabajo, calendario asociado y asignaciones históricas."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{location.code}</strong>
              <span className="muted">Código</span>
            </article>
            <article className="stat stat--compact">
              <strong>{location.timezone ?? '—'}</strong>
              <span className="muted">Zona</span>
            </article>
            <article className="stat stat--compact">
              <strong>{assignments.length}</strong>
              <span className="muted">Asignaciones</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Detalle</h2>
            <p className="meta">
              {location.address ?? 'Sin dirección'} · {location.city ?? '—'} · {location.province ?? '—'} · {location.postalCode ?? '—'}
            </p>
          </div>
          <span className={`badge ${location.active ? 'badge-success' : 'badge-danger'}`}>{location.active ? 'Activo' : 'Inactivo'}</span>
        </div>
        <p className="meta">Calendario asociado: {location.calendarName ?? 'Ninguno'}</p>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Asignaciones históricas</h2>
            <p className="meta">Movilidad de empleados entre centros de trabajo.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Vigencia</th>
                <th>Principal</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.employeeNombre}</td>
                  <td>
                    {formatLongDate(assignment.validFrom)} {assignment.validTo ? `- ${formatLongDate(assignment.validTo)}` : ''}
                  </td>
                  <td>{assignment.primary ? 'Sí' : 'No'}</td>
                  <td>{assignment.notes ?? '—'}</td>
                </tr>
              ))}
              {!assignments.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Sin asignaciones.
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
