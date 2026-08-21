'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { api, type PublicUser } from '../../lib/api/generated';
import { clearSession, getAccessToken, getStoredSession } from '../../lib/auth/session';

export default function ProfilePage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }

    async function load() {
      try {
        const token = getAccessToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        setUser(await api.auth.me(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, session]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await api.auth.changePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword
      });
      clearSession();
      setMessage('Contraseña actualizada. Vuelve a iniciar sesión.');
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Perfil</span>
        <h1>Cargando perfil...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Cuenta</span>
        <h1>Perfil</h1>
        <p>Datos visibles de tu usuario autenticado y cambio de contraseña.</p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        {message ? <div className="notice" role="status">{message}</div> : null}
        {user ? (
          <div className="grid-3" style={{ marginTop: '1.5rem' }}>
            <article className="stat">
              <strong>{user.numero}</strong>
              <span className="muted">Número</span>
            </article>
            <article className="stat">
              <strong>{user.nombreEmpleado}</strong>
              <span className="muted">Nombre</span>
            </article>
            <article className="stat">
              <strong>{user.roles.join(', ') || 'Empleado'}</strong>
              <span className="muted">Roles</span>
            </article>
          </div>
        ) : null}
      </section>

      <form className="panel stack" onSubmit={onSubmit}>
        <h2 className="section-title">Cambiar contraseña</h2>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="currentPassword">Contraseña actual</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">Nueva contraseña</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirmación</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
}
