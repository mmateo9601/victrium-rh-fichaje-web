import Link from 'next/link';
import { ArrowRight, CalendarCheck2, ShieldCheck, TimerReset, Users2 } from 'lucide-react';

export default function Page() {
  return (
    <main className="home-shell">
      <section className="landing-shell">
        <div className="landing-copy">
          <span className="eyebrow">Victrium RH</span>
          <h1>Gestión de personas con una interfaz precisa, sobria y rápida.</h1>
          <p>
            Control horario, vacaciones, permisos e incidencias desde un espacio de trabajo claro para el día a
            día.
          </p>

          <div className="landing-actions">
            <Link className="button button-primary" href="/login">
              Acceder
              <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" href="/dashboard">
              Ver espacio de trabajo
            </Link>
          </div>

          <div className="landing-metrics">
            <article className="stat">
              <TimerReset size={18} />
              <strong>Mi jornada</strong>
              <span className="muted">Inicio, pausa y cierre en un solo gesto.</span>
            </article>
            <article className="stat">
              <Users2 size={18} />
              <strong>Personas</strong>
              <span className="muted">Empleados, usuarios y estados visibles de un vistazo.</span>
            </article>
            <article className="stat">
              <CalendarCheck2 size={18} />
              <strong>Ausencias</strong>
              <span className="muted">Vacaciones, permisos e incidencias bajo control.</span>
            </article>
            <article className="stat">
              <ShieldCheck size={18} />
              <strong>Acceso seguro</strong>
              <span className="muted">Cada usuario entra en su espacio según permisos.</span>
            </article>
          </div>
        </div>

        <div className="landing-panel">
          <div className="landing-card">
            <span className="eyebrow">Experiencia corporativa</span>
            <h2>Todo lo importante, en una sola vista.</h2>
            <p>
              Una navegación limpia, listados densos y paneles diseñados para trabajar con comodidad durante toda
              la jornada.
            </p>
          </div>

          <div className="landing-grid">
            <article className="feature-card">
              <span className="feature-card__icon">
                <TimerReset size={18} />
              </span>
              <strong>Control horario</strong>
              <p>Entrada, pausa, reanudación y fin con estado siempre claro.</p>
            </article>
            <article className="feature-card">
              <span className="feature-card__icon">
                <Users2 size={18} />
              </span>
              <strong>Gestión de personas</strong>
              <p>Directorio, detalle y seguimiento de la actividad laboral.</p>
            </article>
            <article className="feature-card">
              <span className="feature-card__icon">
                <ShieldCheck size={18} />
              </span>
              <strong>Solicitudes y ausencias</strong>
              <p>Vacaciones, permisos e incidencias con un patrón uniforme.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
