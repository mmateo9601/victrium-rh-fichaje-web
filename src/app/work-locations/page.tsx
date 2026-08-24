'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { api, type Company, type WorkLocation } from '../../lib/api/generated';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';
import { getTimezoneOptions } from '../../lib/timezones';

export default function WorkLocationsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const roles = useMemo(() => getEffectiveRoles(session), [session]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('Madrid Centro');
  const [code, setCode] = useState('MAD-CENTRO');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [address, setAddress] = useState('Calle Gran Vía 1');
  const [city, setCity] = useState('Madrid');
  const [province, setProvince] = useState('Madrid');
  const [postalCode, setPostalCode] = useState('28013');
  const timezoneOptions = getTimezoneOptions();

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');
    const canManage = roles.some((role) => role === 'ROLE_COMPANY_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN');
    if (!canManage) {
      router.replace('/forbidden');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        const locationsResult = await api.workLocations.list(token, {
          search,
          active,
          companyId: roles.includes('ROLE_SUPER_ADMIN') && companyFilter ? Number(companyFilter) : undefined
        });
        setLocations(locationsResult.data);

        if (isSuperAdmin) {
          const companiesResult = await api.companies.list(token, { pageSize: 100 });
          setCompanies(companiesResult.data);
          setCompanyId((current) => current || (companiesResult.data[0] ? String(companiesResult.data[0].id) : ''));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los centros');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [active, companyFilter, router, roles, search, session]);

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
      if (roles.includes('ROLE_SUPER_ADMIN') && !companyId) {
        throw new Error('Selecciona una empresa para crear el centro');
      }
      await api.workLocations.create(token, {
        companyId: roles.includes('ROLE_SUPER_ADMIN') ? Number(companyId) || undefined : undefined,
        name,
        code,
        timezone,
        address,
        city,
        province,
        postalCode
      });
      const refreshed = await api.workLocations.list(token, {
        search,
        active,
        companyId: roles.includes('ROLE_SUPER_ADMIN') && companyFilter ? Number(companyFilter) : undefined
      });
      setLocations(refreshed.data);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el centro');
    } finally {
      setCreating(false);
    }
  }

  async function toggleLocationActive(location: WorkLocation) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setTogglingId(location.id);
    setError(null);
    try {
      await api.workLocations.update(token, location.id, {
        companyId: location.companyId ?? undefined,
        name: location.name,
        code: location.code,
        timezone: location.timezone ?? null,
        address: location.address ?? null,
        city: location.city ?? null,
        province: location.province ?? null,
        postalCode: location.postalCode ?? null,
        active: !location.active
      });
      const refreshed = await api.workLocations.list(token, {
        search,
        active,
        companyId: roles.includes('ROLE_SUPER_ADMIN') && companyFilter ? Number(companyFilter) : undefined
      });
      setLocations(refreshed.data);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'No se pudo cambiar el estado del centro');
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteLocation(location: WorkLocation) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!window.confirm(`¿Eliminar el centro ${location.name}? Esta acción solo se permite si no tiene dependencias.`)) {
      return;
    }

    setTogglingId(location.id);
    setError(null);
    try {
      await api.workLocations.delete(token, location.id);
      const refreshed = await api.workLocations.list(token, {
        search,
        active,
        companyId: roles.includes('ROLE_SUPER_ADMIN') && companyFilter ? Number(companyFilter) : undefined
      });
      setLocations(refreshed.data);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el centro');
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Organización</span>
        <h1>Cargando centros...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title="Centros de trabajo"
        description="Gestiona sedes, calendarios locales y la base para planificación multicentro. La zona horaria se elige siempre de una lista; los campos de planificación usan minutos y horas según corresponda."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{locations.length}</strong>
              <span className="muted">Centros visibles</span>
            </article>
            <article className="stat stat--compact">
              <strong>{session?.user.email ?? session?.user.nombreEmpleado ?? '—'}</strong>
              <span className="muted">Cuenta actual</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <form className="panel stack" onSubmit={submit}>
        <div className="toolbar">
          <div>
            <h2 className="section-title">Nuevo centro</h2>
            <p className="meta">Crea una sede con zona horaria, dirección y código interno.</p>
          </div>
          <button className="button button-primary" type="submit" disabled={creating}>
            {creating ? 'Guardando...' : 'Crear centro'}
          </button>
        </div>

          <div className="field-grid">
          {roles.includes('ROLE_SUPER_ADMIN') ? (
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
              {!companies.length ? <p className="meta">No hay empresas cargadas para enlazar el centro.</p> : null}
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
        </div>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Activos, desactivados y centros preparados para calendario local.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input className="field" style={{ minWidth: '220px' }} placeholder="Buscar centro..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {roles.includes('ROLE_SUPER_ADMIN') ? (
              <select className="field" style={{ minWidth: '220px' }} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="">Todas las empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
            ) : null}
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
                <th>Centro</th>
                <th>Código</th>
                <th>Ciudad</th>
                <th>Zona</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  <td>{location.code}</td>
                  <td>{location.city ?? '—'}</td>
                  <td>{location.timezone ?? '—'}</td>
                    <td><span className={`badge ${location.active ? 'badge-success' : 'badge-danger'}`}>{location.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <div className="inline-actions">
                        <Link className="button button-secondary" href={`/work-locations/${location.id}`}>
                          Abrir
                        </Link>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => void toggleLocationActive(location)}
                          disabled={togglingId === location.id}
                        >
                          {location.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => void deleteLocation(location)}
                          disabled={togglingId === location.id}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!locations.length ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin centros.
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
