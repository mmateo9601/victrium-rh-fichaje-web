'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <section className="two-col">
      <div className="hero">
        <span className="eyebrow">Acceso seguro</span>
        <h1>Entrar al panel de RRHH.</h1>
        <p>
          Inicia sesión con el número de empleado y la contraseña proporcionados por la API.
        </p>
        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>JWT</strong>
            <span className="muted">Access + refresh tokens.</span>
          </article>
          <article className="stat">
            <strong>Scoped</strong>
            <span className="muted">La empresa viaja en el token.</span>
          </article>
        </div>
      </div>

      <form className="panel stack" onSubmit={onSubmit}>
        <div className="stack">
          <h2 className="section-title">Iniciar sesión</h2>
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
          />
        </div>

        {error ? <div className="notice" role="alert">{error}</div> : null}

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? 'Validando...' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
