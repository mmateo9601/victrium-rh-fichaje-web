'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type ApiKey, type PublicUser } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';

export default function ApiKeysPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [plainApiKey, setPlainApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = session?.user.roles.some((role) => role === 'ROLE_SUPER_ADMIN') ?? false;

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }

    if (!canManage) {
      router.replace('/forbidden');
      return;
    }

    async function load() {
      try {
        const token = getAccessToken();
        if (!token) {
          router.replace('/login');
          return;
        }

        const [apiKeysResult, usersResult] = await Promise.all([
          api.apiKeys.list(token, { search, pageSize: 50 }),
          api.users.list(token, { pageSize: 100 })
        ]);
        setApiKeys(apiKeysResult.data);
        setUsers(usersResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las API keys');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, session, canManage, search]);

  async function createApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    setPlainApiKey(null);
    try {
      const created = await api.apiKeys.create(token, {
        name,
        description: description || undefined,
        userId: Number(userId),
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined
      });
      setPlainApiKey(created.plainApiKey ?? null);
      const refreshed = await api.apiKeys.list(token, { search, pageSize: 50 });
      setApiKeys(refreshed.data);
      setName('');
      setDescription('');
      setExpiresInDays('');
      setUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la API key');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: number, active: boolean) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      if (active) {
        await api.apiKeys.deactivate(token, id);
      } else {
        await api.apiKeys.activate(token, id);
      }
      const refreshed = await api.apiKeys.list(token, { search, pageSize: 50 });
      setApiKeys(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la API key');
    }
  }

  async function removeApiKey(id: number) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      await api.apiKeys.delete(token, id);
      const refreshed = await api.apiKeys.list(token, { search, pageSize: 50 });
      setApiKeys(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la API key');
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Claves</span>
        <h1>Cargando claves...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Seguridad</span>
        <h1>Claves de integración</h1>
        <p>Gestiona las credenciales de acceso de las integraciones externas desde un único lugar.</p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        {plainApiKey ? (
          <div className="notice" role="status">
            Clave creada: <code>{plainApiKey}</code>
          </div>
        ) : null}
      </section>

      <form className="panel stack" onSubmit={createApiKey}>
        <h2 className="section-title">Crear clave</h2>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <input id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="userId">Usuario</label>
            <select id="userId" value={userId} onChange={(event) => setUserId(event.target.value)} required>
              <option value="">Selecciona un usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.numero} - {user.nombreEmpleado}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="expiresInDays">Expira en días</label>
            <input
              id="expiresInDays"
              type="number"
              min="1"
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
            />
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? 'Creando...' : 'Crear clave'}
        </button>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Scope por empresa y usuario, sin exponer hashes.</p>
          </div>
          <input
            className="field"
            style={{ minWidth: '240px' }}
            placeholder="Buscar..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Expira</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td>{key.userNumero} - {key.userNombreEmpleado}</td>
                  <td>{key.companyId ?? 'Global'}</td>
                  <td>
                    <span className={`badge ${key.active ? 'badge-success' : 'badge-danger'}`}>
                      {key.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('es-ES') : 'Sin expiración'}</td>
                  <td>
                    <div className="hero-actions" style={{ gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => toggleActive(key.id, key.active)}
                      >
                        {key.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => removeApiKey(key.id)}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!apiKeys.length ? (
                <tr>
                  <td colSpan={6} className="muted">
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
