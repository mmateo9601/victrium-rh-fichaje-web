'use client';

import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <section className="hero">
      <span className="eyebrow">Acceso restringido</span>
      <h1>No tienes permiso para ver esta sección</h1>
      <p>
        Tu rol actual no incluye acceso a esta funcionalidad. Si crees que debería estar disponible, revisa
        tu perfil o consulta con administración.
      </p>
      <div className="hero-actions">
        <Link className="button button-primary" href="/dashboard">
          Ir al inicio
        </Link>
        <Link className="button button-secondary" href="/profile">
          Revisar perfil
        </Link>
      </div>
    </section>
  );
}
