'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type PublicUser } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';

export default function UsersPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canAccess = session?.user.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN') ?? false;
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!canAccess) {
      router.replace('/forbidden');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const result = await api.users.list(authToken, { search, pageSize: 50 });
        setUsers(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar usuarios');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search, canAccess]);

  async function exportCsv() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const items = await collectAllPages((query) => api.users.list(token, { search, ...query }), { search });
      const csv = buildCsv(
        ['Número', 'Nombre', 'Empresa', 'Roles', 'Admin'],
        items.map((user) => [
          user.numero,
          user.nombreEmpleado,
          user.companyId ?? 'Global',
          user.roles.join(', '),
          user.admin ? 'Sí' : 'No'
        ])
      );
      downloadCsv('usuarios.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar los usuarios');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Usuarios</span>
        <h1>Cargando usuarios...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Identidad</span>
        <h1>Usuarios</h1>
        <p>Listado de identidades de acceso para la organización.</p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Se filtra por la empresa del usuario autenticado.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '240px' }}
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="button button-secondary" type="button" onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Roles</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.numero}</td>
                  <td>{user.nombreEmpleado}</td>
                  <td>{user.companyId ?? 'Global'}</td>
                  <td>{user.roles.join(', ')}</td>
                  <td>{user.admin ? 'Sí' : 'No'}</td>
                </tr>
              ))}
              {!users.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Sin resultados.
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
