'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { api, type WorkLocation } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';

export default function WorkLocationsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('Madrid Centro');
  const [code, setCode] = useState('MAD-CENTRO');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [address, setAddress] = useState('Calle Gran Vía 1');
  const [city, setCity] = useState('Madrid');
  const [province, setProvince] = useState('Madrid');
  const [postalCode, setPostalCode] = useState('28013');

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const canManage = session?.user.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN') ?? false;
    if (!canManage) {
      router.replace('/forbidden');
      return;
    }
    const token = accessToken;

    async function load() {
      try {
        const result = await api.workLocations.list(token, { search, active });
        setLocations(result.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los centros');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [active, router, search, session]);

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
      await api.workLocations.create(token, {
        name,
        code,
        timezone,
        address,
        city,
        province,
        postalCode
      });
      const refreshed = await api.workLocations.list(token, { search, active });
      setLocations(refreshed.data);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el centro');
    } finally {
      setCreating(false);
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
        description="Gestiona sedes, calendarios locales y la base para planificación multicentro."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{locations.length}</strong>
              <span className="muted">Centros visibles</span>
            </article>
            <article className="stat stat--compact">
              <strong>{session?.user.nombreEmpleado ?? '—'}</strong>
              <span className="muted">Usuario actual</span>
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
                    <Link className="button button-secondary" href={`/work-locations/${location.id}`}>
                      Abrir
                    </Link>
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
