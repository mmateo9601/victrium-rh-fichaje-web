'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';

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
          <span className="eyebrow">Victrium RH</span>
          <h1>Accede a tu espacio de trabajo.</h1>
          <p>
            La pantalla de acceso está pensada para entrar rápido, sin ruido y con una jerarquía visual muy
            clara.
          </p>
        </div>

        <div className="login-points">
          <article className="stat">
            <LockKeyhole size={18} />
            <strong>Acceso privado</strong>
            <span className="muted">Cada persona entra en su área correspondiente.</span>
          </article>
          <article className="stat">
            <BadgeCheck size={18} />
            <strong>Rápido</strong>
            <span className="muted">Número de empleado y contraseña en una sola vista.</span>
          </article>
          <article className="stat">
            <Sparkles size={18} />
            <strong>Ordenado</strong>
            <span className="muted">Un inicio sobrio, sin distracciones técnicas.</span>
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
            <h2 className="section-title">Acceso a Victrium RH</h2>
            <p className="meta">Introduce tus credenciales para continuar.</p>
          </div>

          <div className="field">
            <label htmlFor="numero">Número de empleado</label>
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
              {!loading ? <ArrowRight size={16} /> : null}
            </button>
            <span className="meta">¿Problemas de acceso? Contacta con RRHH.</span>
          </div>
        </form>
      </section>
    </main>
  );
}
