'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '../../lib/api/generated';
import { clearSession, getStoredSession, saveSession } from '../../lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [numero, setNumero] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredSession()) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      clearSession();
      const session = await api.auth.login({ numero, password });
      saveSession(session);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="login-brand">
          <span className="eyebrow">Acceso seguro</span>
          <h1>Entrar al panel de RRHH.</h1>
          <p>
            Una experiencia sobria para empleados, RRHH y administración. Inicia sesión con tu número de
            empleado y la contraseña proporcionados por la API.
          </p>
        </div>

        <div className="login-points">
          <article className="stat">
            <strong>JWT</strong>
            <span className="muted">Access + refresh tokens.</span>
          </article>
          <article className="stat">
            <strong>Scoped</strong>
            <span className="muted">La empresa viaja en el token.</span>
          </article>
          <article className="stat">
            <strong>Seguro</strong>
            <span className="muted">Sesión local y revocación de refresh.</span>
          </article>
        </div>

        <Link className="button button-secondary" href="/">
          Volver a la portada
        </Link>
      </section>

      <section className="login-card">
        <form onSubmit={onSubmit}>
          <div className="stack">
            <span className="eyebrow">Inicio de sesión</span>
            <h2 className="section-title">Accede a tu espacio de trabajo</h2>
            <p className="meta">La app almacena la sesión localmente para navegar entre módulos.</p>
          </div>

          <div className="field">
            <label htmlFor="numero">Número</label>
            <input
              id="numero"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              placeholder="EMP001"
              autoComplete="username"
              inputMode="text"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <div className="notice" role="alert">{error}</div> : null}

          <div className="login-footer">
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? 'Validando...' : 'Entrar'}
            </button>
            <span className="meta">¿Problemas de acceso? Contacta con RRHH.</span>
          </div>
        </form>
      </section>
    </main>
  );
}
