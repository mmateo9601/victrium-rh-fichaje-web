'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type PublicUser } from '../../lib/api/generated';
import { getAccessToken } from '../../lib/auth/session';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const result = await api.users.list(authToken, { search, pageSize: 50 });
        setUsers(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Users');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search]);

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Users</span>
        <h1>Cargando usuarios...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Identidad</span>
        <h1>Users</h1>
        <p>Listado de identidades de acceso. Nunca expone hashes, secretos ni tokens.</p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Se filtra por la empresa del usuario autenticado.</p>
          </div>
          <input
            className="field"
            style={{ minWidth: '240px' }}
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
