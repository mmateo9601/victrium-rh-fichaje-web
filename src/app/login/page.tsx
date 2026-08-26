'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';

import { api } from '../../lib/api/generated';
import { clearSession, getStoredSession, saveSession } from '../../lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
      const session = await api.auth.login({ email, password });
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
            Acceso corporativo con correo electrónico y contraseña. Sin pasos extra, sin distracciones y
            con una jerarquía visual clara.
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
            <span className="muted">Correo electrónico y contraseña en una sola vista.</span>
          </article>
          <article className="stat">
            <Sparkles size={18} />
            <strong>Ordenado</strong>
            <span className="muted">Un inicio sobrio, sin distracciones técnicas.</span>
          </article>
        </div>

        <div className="notice">
          <strong>Acceso único</strong>
          <div className="meta">El sistema solo solicita correo y contraseña para mantener una experiencia clara y homogénea.</div>
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
            <p className="meta">Introduce tus credenciales para continuar con el mismo acceso de siempre.</p>
          </div>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="superadmin@victrium.local"
              autoComplete="username"
              inputMode="email"
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
