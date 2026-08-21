'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type Incident, type IncidentMonthlyStat, type IncidentTopSummary, type IncidentUserStat } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';

const badgeForResolved = (resolved: boolean) => (resolved ? 'badge-success' : 'badge-warning');

export default function IncidentsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canManage = session?.user.roles.includes('ROLE_ADMIN') || session?.user.roles.includes('ROLE_RRHH');

  const [mine, setMine] = useState<Incident[]>([]);
  const [all, setAll] = useState<Incident[]>([]);
  const [months, setMonths] = useState<IncidentMonthlyStat[]>([]);
  const [users, setUsers] = useState<IncidentUserStat[]>([]);
  const [top, setTop] = useState<IncidentTopSummary[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createDescripcion, setCreateDescripcion] = useState('');
  const [createResumen, setCreateResumen] = useState('');
  const [createDia, setCreateDia] = useState('');
  const [createExplicacion, setCreateExplicacion] = useState('');
  const [creating, setCreating] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    async function load() {
      try {
        const query = { search, page, pageSize: 10, order: 'desc' as const };
        const mineResult = await api.incidents.mine(authToken, query);
        setMine(mineResult.data);
        setTotalPages(mineResult.pagination.totalPages || 1);

        if (canManage) {
          const [allResult, monthsResult, usersResult, topResult] = await Promise.all([
            api.incidents.list(authToken, query),
            api.incidents.statsMonths(authToken),
            api.incidents.statsUsers(authToken),
            api.incidents.statsTop(authToken)
          ]);
          setAll(allResult.data);
          setMonths(monthsResult);
          setUsers(usersResult);
          setTop(topResult);
        } else {
          setAll([]);
          setMonths([]);
          setUsers([]);
          setTop([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Incidents');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, canManage, page, search]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;
    const query = { search, page, pageSize: 10, order: 'desc' as const };
    const mineResult = await api.incidents.mine(authToken, query);
    setMine(mineResult.data);
    setTotalPages(mineResult.pagination.totalPages || 1);
    if (canManage) {
      const [allResult, monthsResult, usersResult, topResult] = await Promise.all([
        api.incidents.list(authToken, query),
        api.incidents.statsMonths(authToken),
        api.incidents.statsUsers(authToken),
        api.incidents.statsTop(authToken)
      ]);
      setAll(allResult.data);
      setMonths(monthsResult);
      setUsers(usersResult);
      setTop(topResult);
    }
  }

  async function submitIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    setCreating(true);
    setError(null);
    try {
      await api.incidents.create(authToken, {
        descripcion: createDescripcion,
        resumen: createResumen,
        dia: createDia,
        explicacion: createExplicacion || undefined
      });
      setCreateDescripcion('');
      setCreateResumen('');
      setCreateDia('');
      setCreateExplicacion('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la incidencia');
    } finally {
      setCreating(false);
    }
  }

  async function exportMineCsv() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExportingMine(true);
    setError(null);
    try {
      const items = await collectAllPages(
        (query) => api.incidents.mine(token, { search, order: 'desc', ...query }),
        { search, order: 'desc' }
      );
      const csv = buildCsv(
        ['Descripción', 'Resumen', 'Día', 'Resuelta', 'Explicación', 'Empleado', 'Empresa'],
        items.map((incident) => [
          incident.descripcion,
          incident.resumen,
          incident.dia,
          incident.resuelta ? 'Sí' : 'No',
          incident.explicacion ?? '',
          incident.employeeNombre ?? incident.employeeNumero ?? '',
          incident.companyName ?? ''
        ])
      );
      downloadCsv('incidencias-mias.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar las incidencias');
    } finally {
      setExportingMine(false);
    }
  }

  async function exportAllCsv() {
    if (!canManage) {
      return;
    }
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExportingAll(true);
    setError(null);
    try {
      const items = await collectAllPages(
        (query) => api.incidents.list(token, { search, order: 'desc', ...query }),
        { search, order: 'desc' }
      );
      const csv = buildCsv(
        ['Descripción', 'Resumen', 'Día', 'Resuelta', 'Explicación', 'Empleado', 'Empresa'],
        items.map((incident) => [
          incident.descripcion,
          incident.resumen,
          incident.dia,
          incident.resuelta ? 'Sí' : 'No',
          incident.explicacion ?? '',
          incident.employeeNombre ?? incident.employeeNumero ?? '',
          incident.companyName ?? ''
        ])
      );
      downloadCsv('incidencias-empresa.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar las incidencias');
    } finally {
      setExportingAll(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Incidents</span>
        <h1>Cargando incidencias...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Operativa</span>
        <h1>Incidents</h1>
        <p>
          Las incidencias registran descripciones de soporte, resumen visible y estado de resolución. RRHH
          puede revisar el conjunto de la empresa y ver sus métricas.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{mine.length}</strong>
            <span className="muted">Mis incidencias visibles</span>
          </article>
          <article className="stat">
            <strong>{session?.user.employeeId ?? 'Sin empleado'}</strong>
            <span className="muted">Employee del token</span>
          </article>
          <article className="stat">
            <strong>{session?.user.roles.join(', ') || 'Sin rol'}</strong>
            <span className="muted">Permisos de sesión</span>
          </article>
        </div>
      </section>

      <form className="panel stack" onSubmit={submitIncident}>
        <h2 className="section-title">Nueva incidencia</h2>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" value={createDescripcion} onChange={(e) => setCreateDescripcion(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="resumen">Resumen</label>
            <input id="resumen" value={createResumen} onChange={(e) => setCreateResumen(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dia">Día</label>
            <input id="dia" type="date" value={createDia} onChange={(e) => setCreateDia(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="explicacion">Explicación</label>
            <textarea
              id="explicacion"
              value={createExplicacion}
              onChange={(e) => setCreateExplicacion(e.target.value)}
            />
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={creating}>
          {creating ? 'Guardando...' : 'Crear incidencia'}
        </button>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Mi listado</h2>
            <p className="meta">Paginación y búsqueda gestionadas por la API.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '240px' }}
              placeholder="Buscar incidencia..."
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
            <button className="button button-secondary" type="button" onClick={exportMineCsv} disabled={exportingMine}>
              {exportingMine ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Resumen</th>
                <th>Día</th>
                <th>Empleado</th>
                <th>Resuelta</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.resumen}</td>
                  <td>{incident.dia}</td>
                  <td>{incident.employeeNombre ?? 'Sin empleado'}</td>
                  <td>
                    <span className={`badge ${badgeForResolved(incident.resuelta)}`}>
                      {incident.resuelta ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>
                    <Link className="button button-secondary" href={`/incidents/${incident.id}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {!mine.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Sin resultados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="hero-actions">
          <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            Anterior
          </button>
          <span className="meta">
            Página {page} de {totalPages}
          </span>
          <button
            className="button button-secondary"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </button>
        </div>
      </section>

      {canManage ? (
        <>
          <section className="panel stack">
            <div className="toolbar">
              <div>
              <h2 className="section-title">Gestión RRHH</h2>
              <p className="meta">Listado completo de incidencias de la empresa.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={exportAllCsv} disabled={exportingAll}>
                {exportingAll ? 'Exportando...' : 'Exportar empresa CSV'}
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Resumen</th>
                    <th>Día</th>
                    <th>Resuelta</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {all.map((incident) => (
                    <tr key={incident.id}>
                      <td>{incident.employeeNombre ?? incident.employeeNumero ?? 'Sin empleado'}</td>
                      <td>{incident.resumen}</td>
                      <td>{incident.dia}</td>
                      <td>
                        <span className={`badge ${badgeForResolved(incident.resuelta)}`}>
                          {incident.resuelta ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>
                        <Link className="button button-secondary" href={`/incidents/${incident.id}`}>
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid-3">
            <article className="panel stack">
              <h2 className="section-title">Evolución 12 meses</h2>
              {months.map((item) => (
                <div className="stat" key={item.month}>
                  <strong>{item.total}</strong>
                  <span className="muted">{item.month}</span>
                </div>
              ))}
            </article>
            <article className="panel stack">
              <h2 className="section-title">Ranking por empleado</h2>
              {users.map((item) => (
                <div className="stat" key={`${item.employeeId ?? item.employeeNumero ?? 'unknown'}-${item.total}`}>
                  <strong>{item.total}</strong>
                  <span className="muted">{item.employeeNombre ?? item.employeeNumero ?? 'Sin empleado'}</span>
                </div>
              ))}
            </article>
            <article className="panel stack">
              <h2 className="section-title">Temas frecuentes</h2>
              {top.map((item) => (
                <div className="stat" key={item.resumen}>
                  <strong>{item.total}</strong>
                  <span className="muted">{item.resumen}</span>
                </div>
              ))}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
