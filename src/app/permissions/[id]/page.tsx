'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { api, type Permission } from '../../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../../lib/auth/session';

const statusColors: Record<Permission['estado'], string> = {
  PENDIENTE: 'badge-warning',
  APROBADO: 'badge-success',
  DENEGADO: 'badge-danger'
};

export default function PermissionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const session = useMemo(() => getStoredSession(), []);
  const canManage =
    session?.user.roles.includes('ROLE_ADMIN') ||
    session?.user.roles.includes('ROLE_RRHH') ||
    session?.user.roles.includes('ROLE_SUPER_ADMIN');
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const permissionId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
        if (!permissionId) {
          throw new Error('Identificador de permiso inválido');
        }
        const item = await api.permissions.byId(authToken, Number(permissionId));
        setPermission(item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el permiso');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id, router]);

  async function refresh() {
    const token = getAccessToken();
    if (!token || !permission) {
      return;
    }
    const refreshed = await api.permissions.byId(token, permission.id);
    setPermission(refreshed);
  }

  async function approve() {
    const token = getAccessToken();
    if (!token || !permission) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.permissions.approve(token, permission.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar el permiso');
    } finally {
      setSaving(false);
    }
  }

  async function deny() {
    const token = getAccessToken();
    if (!token || !permission) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.permissions.deny(token, permission.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo denegar el permiso');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const token = getAccessToken();
    if (!token || !permission) {
      router.replace('/login');
      return;
    }

    if (!window.confirm('¿Eliminar este permiso?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.permissions.delete(token, permission.id);
      router.push('/permissions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el permiso');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Permission detail</span>
        <h1>Cargando detalle...</h1>
      </section>
    );
  }

  if (!permission) {
    return (
      <section className="hero">
        <span className="eyebrow">Permission detail</span>
        <h1>Permiso no encontrado</h1>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Detalle</span>
        <h1>{permission.descripcion}</h1>
        <p>
          {permission.employeeNombre ?? permission.employeeNumero ?? 'Sin empleado'} - {permission.dia}{' '}
          {permission.horaInicio} - {permission.horaFin}
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{permission.estado}</strong>
            <span className="muted">Estado</span>
          </article>
          <article className="stat">
            <strong>{permission.companyName ?? 'Global'}</strong>
            <span className="muted">Empresa</span>
          </article>
          <article className="stat">
            <strong>{permission.aprobado ? 'Sí' : 'No'}</strong>
            <span className="muted">Aprobado</span>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <h2 className="section-title">Resumen</h2>
        <div className="field-grid">
          <div className="field">
            <label>Día</label>
            <input value={permission.dia} readOnly />
          </div>
          <div className="field">
            <label>Hora inicio</label>
            <input value={permission.horaInicio} readOnly />
          </div>
          <div className="field">
            <label>Hora fin</label>
            <input value={permission.horaFin} readOnly />
          </div>
          <div className="field">
            <label>Descripción</label>
            <textarea value={permission.descripcion} readOnly />
          </div>
        </div>
        <div className="notice">
          <strong>Empleado vinculado</strong>
          <div className="meta">
            {permission.employeeNombre ?? permission.employeeNumero ?? 'Sin empleado'} - {permission.employeeEmail ?? 'Sin email'}
          </div>
        </div>
        <div className="hero-actions">
          <button className="button button-secondary" type="button" onClick={() => router.push('/permissions')}>
            Volver
          </button>
          {canManage ? (
            <>
              <button className="button button-primary" type="button" onClick={approve} disabled={saving}>
                Aprobar
              </button>
              <button className="button button-secondary" type="button" onClick={deny} disabled={saving}>
                Denegar
              </button>
              <button className="button button-danger" type="button" onClick={remove} disabled={saving}>
                Eliminar
              </button>
            </>
          ) : null}
        </div>
        <span className={`badge ${statusColors[permission.estado]}`}>{permission.estado}</span>
      </section>
    </div>
  );
}
