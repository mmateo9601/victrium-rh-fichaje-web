'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '../../../components/page-header';
import { api, type Company, type EmployeeLocationAssignment, type WorkLocation } from '../../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../../lib/auth/session';
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
  const session = useMemo(() => getStoredSession(), []);
  const [location, setLocation] = useState<WorkLocation | null>(null);
  const [assignments, setAssignments] = useState<EmployeeLocationAssignment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [active, setActive] = useState(true);
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;
    const isSuperAdmin = session?.user.roles.includes('ROLE_SUPER_ADMIN') ?? false;
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
        setName(locationResult.name);
        setCode(locationResult.code);
        setTimezone(locationResult.timezone ?? '');
        setAddress(locationResult.address ?? '');
        setCity(locationResult.city ?? '');
        setProvince(locationResult.province ?? '');
        setPostalCode(locationResult.postalCode ?? '');
        setActive(locationResult.active);
        setCompanyId(locationResult.companyId ? String(locationResult.companyId) : '');
        setAssignments(assignmentsResult.data);
        if (isSuperAdmin) {
          const companiesResult = await api.companies.list(token, { pageSize: 100 });
          setCompanies(companiesResult.data);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el centro');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [locationId, router, session]);

  async function save() {
    const token = getAccessToken();
    if (!token || !location) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await api.workLocations.update(token, location.id, {
        companyId: companyId ? Number(companyId) : undefined,
        name,
        code,
        timezone: timezone || null,
        address: address || null,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
        active
      });
      setLocation(updated);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el centro');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(nextActive: boolean) {
    const token = getAccessToken();
    if (!token || !location) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = nextActive
        ? await api.workLocations.activate(token, location.id)
        : await api.workLocations.deactivate(token, location.id);
      setLocation(updated);
      setActive(updated.active);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo cambiar el estado');
    } finally {
      setSaving(false);
    }
  }

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

      <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <div className="toolbar">
          <div>
            <h2 className="section-title">Editar centro</h2>
            <p className="meta">Ajusta datos, dirección y estado del centro de trabajo.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <button className="button button-secondary" type="button" onClick={() => void setStatus(true)} disabled={saving}>
              Activar
            </button>
            <button className="button button-secondary" type="button" onClick={() => void setStatus(false)} disabled={saving}>
              Desactivar
            </button>
          </div>
        </div>
        <div className="field-grid">
          {session?.user.roles.includes('ROLE_SUPER_ADMIN') ? (
            <div className="field">
              <label htmlFor="companyId">Empresa</label>
              <select
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value="">Selecciona una empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
              {!companies.length ? <p className="meta">Cargando empresas...</p> : null}
            </div>
          ) : null}
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
            <input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="address">Dirección</label>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="city">Ciudad</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="province">Provincia</label>
            <input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="postalCode">Código postal</label>
            <input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="active">Estado</label>
            <select id="active" value={String(active)} onChange={(e) => setActive(e.target.value === 'true')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

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
