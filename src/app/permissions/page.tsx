'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { WorkforceCalendar } from '../../components/workforce-calendar';
import { api, type Permission, type PermissionMonthlyStat, type PermissionUserStat } from '../../lib/api/generated';
import { buildPermissionEvents } from '../../lib/calendar';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';

const statusColors: Record<Permission['estado'], string> = {
  PENDIENTE: 'badge-warning',
  APROBADO: 'badge-success',
  DENEGADO: 'badge-danger'
};

export default function PermissionsPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canManage = session?.user.roles.includes('ROLE_ADMIN') || session?.user.roles.includes('ROLE_RRHH');

  const [mine, setMine] = useState<Permission[]>([]);
  const [all, setAll] = useState<Permission[]>([]);
  const [months, setMonths] = useState<PermissionMonthlyStat[]>([]);
  const [users, setUsers] = useState<PermissionUserStat[]>([]);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dia, setDia] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [descripcion, setDescripcion] = useState('');
  const [creating, setCreating] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarPermissions = useMemo(() => buildPermissionEvents(canManage ? all : mine), [all, canManage, mine]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    async function load() {
      try {
        const query = { search, estado, page, pageSize: 8, order: 'desc' as const };
        const mineResult = await api.permissions.mine(authToken, query);
        setMine(mineResult.data);
        setTotalPages(mineResult.pagination.totalPages || 1);

        if (canManage) {
          const [allResult, monthsResult, usersResult] = await Promise.all([
            api.permissions.list(authToken, query),
            api.permissions.statsMonths(authToken),
            api.permissions.statsUsers(authToken)
          ]);
          setAll(allResult.data);
          setMonths(monthsResult);
          setUsers(usersResult);
        } else {
          setAll([]);
          setMonths([]);
          setUsers([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Permissions');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, canManage, page, search, estado]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;
    const query = { search, estado, page, pageSize: 8, order: 'desc' as const };
    const mineResult = await api.permissions.mine(authToken, query);
    setMine(mineResult.data);
    setTotalPages(mineResult.pagination.totalPages || 1);
    if (canManage) {
      const [allResult, monthsResult, usersResult] = await Promise.all([
        api.permissions.list(authToken, query),
        api.permissions.statsMonths(authToken),
        api.permissions.statsUsers(authToken)
      ]);
      setAll(allResult.data);
      setMonths(monthsResult);
      setUsers(usersResult);
    }
  }

  async function submitPermission(event: FormEvent<HTMLFormElement>) {
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
      await api.permissions.create(authToken, {
        dia,
        horaInicio,
        horaFin,
        descripcion
      });
      setDia('');
      setHoraInicio('09:00');
      setHoraFin('10:00');
      setDescripcion('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el permiso');
    } finally {
      setCreating(false);
    }
  }

  async function approvePermission(id: number) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setError(null);
    try {
      await api.permissions.approve(token, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar el permiso');
    }
  }

  async function denyPermission(id: number) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setError(null);
    try {
      await api.permissions.deny(token, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo denegar el permiso');
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
        (query) => api.permissions.mine(token, { search, estado, order: 'desc', ...query }),
        { search, estado, order: 'desc' }
      );
      const csv = buildCsv(
        ['Día', 'Hora inicio', 'Hora fin', 'Descripción', 'Estado', 'Aprobado', 'Empleado', 'Empresa'],
        items.map((permission) => [
          permission.dia,
          permission.horaInicio,
          permission.horaFin,
          permission.descripcion,
          permission.estado,
          permission.aprobado ? 'Sí' : 'No',
          permission.employeeNombre ?? permission.employeeNumero ?? '',
          permission.companyName ?? ''
        ])
      );
      downloadCsv('permisos-mios.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar los permisos');
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
        (query) => api.permissions.list(token, { search, estado, order: 'desc', ...query }),
        { search, estado, order: 'desc' }
      );
      const csv = buildCsv(
        ['Día', 'Hora inicio', 'Hora fin', 'Descripción', 'Estado', 'Aprobado', 'Empleado', 'Empresa'],
        items.map((permission) => [
          permission.dia,
          permission.horaInicio,
          permission.horaFin,
          permission.descripcion,
          permission.estado,
          permission.aprobado ? 'Sí' : 'No',
          permission.employeeNombre ?? permission.employeeNumero ?? '',
          permission.companyName ?? ''
        ])
      );
      downloadCsv('permisos-empresa.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar los permisos');
    } finally {
      setExportingAll(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Permissions</span>
        <h1>Cargando permisos...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Permisos laborales</span>
        <h1>Permissions</h1>
        <p>
          Gestiona las solicitudes de permisos, revisa el histórico y aprueba o deniega desde la misma
          interfaz. El usuario siempre crea sobre su propio contexto salvo que tenga rol de gestión.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{mine.length}</strong>
            <span className="muted">Mis permisos visibles</span>
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

      <form className="panel stack" onSubmit={submitPermission}>
        <h2 className="section-title">Nuevo permiso</h2>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="dia">Día</label>
            <input id="dia" type="date" value={dia} onChange={(event) => setDia(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="horaInicio">Hora inicio</label>
            <input id="horaInicio" type="time" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="horaFin">Hora fin</label>
            <input id="horaFin" type="time" value={horaFin} onChange={(event) => setHoraFin(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={creating}>
          {creating ? 'Enviando...' : 'Solicitar permiso'}
        </button>
      </form>

      <WorkforceCalendar
        title="Calendario de permisos"
        description="Lectura visual de permisos por día y hora. La misma información, mejor distribuida."
        events={calendarPermissions}
        loading={loading}
        emptyLabel="No hay permisos para mostrar con los filtros actuales."
        initialView="timeGridWeek"
        legend={[
          { label: 'Permiso', tone: 'warning' }
        ]}
        compact
      />

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Mis permisos</h2>
            <p className="meta">Paginación, búsqueda y filtros por estado para tu seguimiento diario.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '240px' }}
              placeholder="Buscar..."
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
            <select className="field" style={{ minWidth: '160px' }} value={estado} onChange={(event) => setEstado(event.target.value)}>
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADO">Aprobados</option>
              <option value="DENEGADO">Denegados</option>
            </select>
            <button className="button button-secondary" type="button" onClick={exportMineCsv} disabled={exportingMine}>
              {exportingMine ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Horario</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((permission) => (
                <tr key={permission.id}>
                  <td>{permission.dia}</td>
                  <td>
                    {permission.horaInicio} - {permission.horaFin}
                  </td>
                  <td>{permission.descripcion}</td>
                  <td>
                    <span className={`badge ${statusColors[permission.estado]}`}>{permission.estado}</span>
                  </td>
                  <td>
                    <Link className="button button-secondary" href={`/permissions/${permission.id}`}>
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
              <p className="meta">Listado completo de permisos de la empresa.</p>
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
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {all.map((permission) => (
                    <tr key={permission.id}>
                      <td>{permission.employeeNombre ?? permission.employeeNumero ?? 'Sin empleado'}</td>
                      <td>{permission.dia}</td>
                      <td>
                        {permission.horaInicio} - {permission.horaFin}
                      </td>
                      <td>
                        <span className={`badge ${statusColors[permission.estado]}`}>{permission.estado}</span>
                      </td>
                      <td className="hero-actions" style={{ gap: '0.5rem' }}>
                        <Link className="button button-secondary" href={`/permissions/${permission.id}`}>
                          Abrir
                        </Link>
                        <button className="button button-primary" type="button" onClick={() => approvePermission(permission.id)}>
                          Aprobar
                        </button>
                        <button className="button button-secondary" type="button" onClick={() => denyPermission(permission.id)}>
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

          <section className="grid-3">
            <article className="panel stack">
              <h2 className="section-title">Evolución 12 meses</h2>
              {months.map((item) => (
                <div className="stat" key={item.month}>
                  <strong>{item.totalMinutes}</strong>
                  <span className="muted">{item.month}</span>
                </div>
              ))}
            </article>
            <article className="panel stack">
              <h2 className="section-title">Ranking por empleado</h2>
              {users.map((item) => (
                <div className="stat" key={`${item.employeeId ?? item.employeeNumero ?? 'unknown'}-${item.totalMinutes}`}>
                  <strong>{item.totalMinutes}</strong>
                  <span className="muted">{item.employeeNombre ?? item.employeeNumero ?? 'Sin empleado'}</span>
                </div>
              ))}
            </article>
            <article className="panel stack">
              <h2 className="section-title">Uso reciente</h2>
              <p className="meta">
                Los permisos aprobados se reflejan en estas métricas para seguir la carga operativa.
              </p>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
