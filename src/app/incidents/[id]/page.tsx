'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { api, type Incident } from '../../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../../lib/auth/session';

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const session = useMemo(() => getStoredSession(), []);
  const canManage =
    session?.user.roles.includes('ROLE_COMPANY_ADMIN') ||
    session?.user.roles.includes('ROLE_RRHH') ||
    session?.user.roles.includes('ROLE_SUPER_ADMIN');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [day, setDay] = useState('');
  const [explanation, setExplanation] = useState('');
  const [resolved, setResolved] = useState(false);
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
        const incidentId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
        if (!incidentId) {
          throw new Error('Identificador de incidencia inválido');
        }
        const item = await api.incidents.byId(authToken, Number(incidentId));
        setIncident(item);
        setDescription(item.descripcion);
        setSummary(item.resumen);
        setDay(item.dia);
        setExplanation(item.explicacion ?? '');
        setResolved(item.resuelta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la incidencia');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id, router]);

  async function save() {
    const token = getAccessToken();
    if (!token || !incident) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.incidents.update(token, incident.id, {
        descripcion: description,
        resumen: summary,
        dia: day,
        explicacion: explanation || undefined,
        resuelta: resolved
      });
      const refreshed = await api.incidents.byId(token, incident.id);
      setIncident(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la incidencia');
    } finally {
      setSaving(false);
    }
  }

  async function resolveIncident() {
    const token = getAccessToken();
    if (!token || !incident) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.incidents.resolve(token, incident.id);
      const refreshed = await api.incidents.byId(token, incident.id);
      setIncident(refreshed);
      setResolved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resolver la incidencia');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Incident detail</span>
        <h1>Cargando detalle...</h1>
      </section>
    );
  }

  if (!incident) {
    return (
      <section className="hero">
        <span className="eyebrow">Incident detail</span>
        <h1>Incidencia no encontrada</h1>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Detalle</span>
        <h1>{incident.resumen}</h1>
        <p>
          {incident.employeeNombre ?? incident.employeeNumero ?? 'Sin empleado'} - {incident.dia}
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>

      <section className="panel stack">
        <h2 className="section-title">Editar incidencia</h2>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="resumen">Resumen</label>
            <input id="resumen" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dia">Día</label>
            <input id="dia" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="explicacion">Explicación</label>
            <textarea id="explicacion" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </div>
        </div>
        <label className="field" htmlFor="resolved">
          <span className="muted">Resuelta</span>
          <select id="resolved" value={String(resolved)} onChange={(e) => setResolved(e.target.value === 'true')}>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </label>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {canManage ? (
            <button className="button button-secondary" type="button" onClick={resolveIncident} disabled={saving}>
              Marcar como resuelta
            </button>
          ) : null}
          <button className="button button-secondary" type="button" onClick={() => router.push('/incidents')}>
            Volver
          </button>
        </div>
      </section>
    </div>
  );
}
