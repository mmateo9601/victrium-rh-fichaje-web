'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type Vacation } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';

const statusColors: Record<Vacation['estado'], string> = {
  PENDIENTE: 'badge-warning',
  APROBADO: 'badge-success',
  DENEGADO: 'badge-danger'
};

export default function VacationsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canManage = session?.user.roles.includes('ROLE_ADMIN') || session?.user.roles.includes('ROLE_RRHH');

  const [mine, setMine] = useState<Vacation[]>([]);
  const [all, setAll] = useState<Vacation[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
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
        const query = { search, page, pageSize: 8, order: 'desc' as const };
        const mineResult = await api.vacations.mine(authToken, query);
        setMine(mineResult.data);
        setTotalPages(mineResult.pagination.totalPages || 1);

        if (canManage) {
          const allResult = await api.vacations.list(authToken, query);
          setAll(allResult.data);
        } else {
          setAll([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar vacaciones');
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

    const query = { search, page, pageSize: 8, order: 'desc' as const };
    const mineResult = await api.vacations.mine(authToken, query);
    setMine(mineResult.data);
    setTotalPages(mineResult.pagination.totalPages || 1);
    if (canManage) {
      const allResult = await api.vacations.list(authToken, query);
      setAll(allResult.data);
    }
  }

  async function submitVacation(event: FormEvent<HTMLFormElement>) {
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
      await api.vacations.create(authToken, { inicio, fin });
      setInicio('');
      setFin('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la vacación');
    } finally {
      setCreating(false);
    }
  }

  async function approveVacation(id: number) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    setError(null);
    try {
      await api.vacations.approve(authToken, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar la vacación');
    }
  }

  async function denyVacation(id: number) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    setError(null);
    try {
      await api.vacations.deny(authToken, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo denegar la vacación');
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
        (query) => api.vacations.mine(token, { search, order: 'desc', ...query }),
        { search, order: 'desc' }
      );
      const csv = buildCsv(
        ['Inicio', 'Fin', 'Empleado', 'Estado', 'Aprobado', 'Empresa'],
        items.map((vacation) => [
          vacation.inicio,
          vacation.fin,
          vacation.employeeNombre ?? vacation.employeeNumero ?? '',
          vacation.estado,
          vacation.aprobado ? 'Sí' : 'No',
          vacation.companyName ?? ''
        ])
      );
      downloadCsv('vacaciones-mias.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar las vacaciones');
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
        (query) => api.vacations.list(token, { search, order: 'desc', ...query }),
        { search, order: 'desc' }
      );
      const csv = buildCsv(
        ['Inicio', 'Fin', 'Empleado', 'Estado', 'Aprobado', 'Empresa'],
        items.map((vacation) => [
          vacation.inicio,
          vacation.fin,
          vacation.employeeNombre ?? vacation.employeeNumero ?? '',
          vacation.estado,
          vacation.aprobado ? 'Sí' : 'No',
          vacation.companyName ?? ''
        ])
      );
      downloadCsv('vacaciones-empresa.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar las vacaciones');
    } finally {
      setExportingAll(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Vacaciones</span>
        <h1>Cargando vacaciones...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Ausencias</span>
        <h1>Vacaciones</h1>
        <p>
          Las solicitudes se crean sobre tu perfil y, si tienes permisos de RRHH o administración,
          también puedes revisar y resolver las de tu empresa.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{mine.length}</strong>
            <span className="muted">Mis solicitudes visibles</span>
          </article>
          <article className="stat">
            <strong>{session?.user.employeeId ?? 'Sin empleado'}</strong>
            <span className="muted">Empleado conectado</span>
          </article>
          <article className="stat">
            <strong>{session?.user.roles.join(', ') || 'Empleado'}</strong>
            <span className="muted">Acceso actual</span>
          </article>
        </div>
      </section>

      <form className="panel stack" onSubmit={submitVacation}>
        <h2 className="section-title">Nueva solicitud</h2>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="inicio">Inicio</label>
            <input id="inicio" type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fin">Fin</label>
            <input id="fin" type="date" value={fin} onChange={(event) => setFin(event.target.value)} />
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={creating}>
          {creating ? 'Enviando...' : 'Solicitar vacaciones'}
        </button>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Mis vacaciones</h2>
            <p className="meta">Histórico paginado filtrado por fechas y estado.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '240px' }}
              placeholder="Buscar por empleado..."
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
                <th>Inicio</th>
                <th>Fin</th>
                <th>Empleado</th>
                <th>Estado</th>
                <th>Aprobado</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((vacation) => (
                <tr key={vacation.id}>
                  <td>{vacation.inicio}</td>
                  <td>{vacation.fin}</td>
                  <td>{vacation.employeeNombre ?? 'Sin empleado'}</td>
                  <td>
                    <span className={`badge ${statusColors[vacation.estado]}`}>{vacation.estado}</span>
                  </td>
                  <td>
                    <span className={`badge ${vacation.aprobado ? 'badge-success' : 'badge-danger'}`}>
                      {vacation.aprobado ? 'Sí' : 'No'}
                    </span>
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
        <section className="panel stack">
          <div className="toolbar">
            <div>
            <h2 className="section-title">Gestión RRHH</h2>
            <p className="meta">Acciones de aprobación y denegación para tu empresa.</p>
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
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {all.map((vacation) => (
                  <tr key={vacation.id}>
                    <td>{vacation.employeeNombre ?? vacation.employeeNumero ?? 'Sin empleado'}</td>
                    <td>{vacation.inicio}</td>
                    <td>{vacation.fin}</td>
                    <td>
                      <span className={`badge ${statusColors[vacation.estado]}`}>{vacation.estado}</span>
                    </td>
                    <td className="hero-actions" style={{ gap: '0.5rem' }}>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => approveVacation(vacation.id)}
                      >
                        Aprobar
                      </button>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => denyVacation(vacation.id)}
                      >
                        Denegar
                      </button>
                    </td>
                  </tr>
                ))}
                {!all.length ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Sin solicitudes para gestionar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
