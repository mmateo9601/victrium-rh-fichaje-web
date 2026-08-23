'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { api, type TimeEntry, type TimeEntryAudit, type TimeEntryType } from '../../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../../lib/auth/session';

const typeColors: Record<TimeEntryType, string> = {
  ENTRADA: 'badge-success',
  SALIDA: 'badge-warning'
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function TimeEntryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const session = useMemo(() => getStoredSession(), []);
  const canManage =
    session?.user.roles.includes('ROLE_COMPANY_ADMIN') ||
    session?.user.roles.includes('ROLE_RRHH') ||
    session?.user.roles.includes('ROLE_SUPER_ADMIN');

  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [audits, setAudits] = useState<TimeEntryAudit[]>([]);
  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState<TimeEntryType>('ENTRADA');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const entryId = typeof params.id === 'string' ? Number(params.id) : Number(Array.isArray(params.id) ? params.id[0] : NaN);
    if (!Number.isFinite(entryId)) {
      setError('Identificador de fichaje inválido');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const authToken = token as string;
        const detail = await api.timeEntries.byId(authToken, entryId);
        setEntry(detail);
        setDia(detail.dia);
        setHora(detail.hora);
        setTipo(detail.tipo);

        if (canManage) {
          const history = await api.timeEntries.audits(authToken, entryId);
          setAudits(history);
        } else {
          setAudits([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el fichaje');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [canManage, params.id, router]);

  async function refresh() {
    const token = getAccessToken();
    if (!token || !entry) {
      return;
    }

    const authToken = token as string;
    const detail = await api.timeEntries.byId(authToken, entry.id);
    setEntry(detail);
    setDia(detail.dia);
    setHora(detail.hora);
    setTipo(detail.tipo);
    if (canManage) {
      const history = await api.timeEntries.audits(authToken, entry.id);
      setAudits(history);
    }
  }

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !entry) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
        const authToken = token as string;
        const updated = await api.timeEntries.correct(authToken, entry.id, {
        dia,
        hora,
        tipo,
        motivo,
        version: entry.version
      });
      setEntry(updated);
      setDia(updated.dia);
      setHora(updated.hora);
      setTipo(updated.tipo);
      setMotivo('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo corregir el fichaje');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Fichajes</span>
        <h1>Cargando detalle...</h1>
      </section>
    );
  }

  if (!entry) {
    return (
      <section className="hero">
        <span className="eyebrow">Fichajes</span>
        <h1>Fichaje no encontrado</h1>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Detalle de fichaje</span>
        <h1>{entry.usuarioNombre}</h1>
        <p>
          {entry.dia} - {entry.hora} - {entry.tipo}
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{entry.usuarioNumero}</strong>
            <span className="muted">Empleado</span>
          </article>
          <article className="stat">
            <strong>{entry.companyName ?? 'Global'}</strong>
            <span className="muted">Empresa</span>
          </article>
          <article className="stat">
            <strong>{entry.version}</strong>
            <span className="muted">Versión de control</span>
          </article>
        </div>
      </section>

      <section className="two-col">
        <section className="panel stack">
          <h2 className="section-title">Datos del fichaje</h2>
          <div className="field-grid">
            <div className="field">
              <label>ID</label>
              <input value={entry.id} readOnly />
            </div>
            <div className="field">
              <label>Empleado</label>
              <input value={`${entry.usuarioNombre} (${entry.usuarioNumero})`} readOnly />
            </div>
            <div className="field">
              <label>Empresa</label>
              <input value={entry.companyName ?? 'Global'} readOnly />
            </div>
            <div className="field">
              <label>Origen</label>
              <input value={entry.origen} readOnly />
            </div>
            <div className="field">
              <label>Última actualización</label>
              <input value={entry.updatedAt ? formatDateTime(entry.updatedAt) : 'Sin cambios'} readOnly />
            </div>
            <div className="field">
              <label>Tipo actual</label>
              <input value={entry.tipo} readOnly />
            </div>
          </div>
          <div className="notice">
            <strong>Estado actual</strong>
            <div className="meta">
              <span className={`badge ${typeColors[entry.tipo]}`} style={{ marginTop: '0.5rem' }}>
                {entry.tipo}
              </span>
            </div>
          </div>
          <div className="hero-actions">
            <button className="button button-secondary" type="button" onClick={() => router.push('/time-entries')}>
              Volver al listado
            </button>
          </div>
        </section>

        {canManage ? (
          <form className="panel stack" onSubmit={submitCorrection}>
            <h2 className="section-title">Corrección controlada</h2>
            <p className="meta">
              Solo RRHH y administración pueden ajustar día, hora o tipo. Cada cambio deja trazabilidad y exige versión.
            </p>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="dia">Día</label>
                <input id="dia" type="date" value={dia} onChange={(event) => setDia(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="hora">Hora</label>
                <input id="hora" type="time" step="1" value={hora} onChange={(event) => setHora(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" value={tipo} onChange={(event) => setTipo(event.target.value as TimeEntryType)}>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="version">Versión</label>
                <input id="version" value={entry.version} readOnly />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="motivo">Motivo</label>
                <textarea
                  id="motivo"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Explica por qué se corrige este fichaje"
                />
              </div>
            </div>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Aplicar corrección'}
            </button>
          </form>
        ) : (
          <section className="panel stack">
            <h2 className="section-title">Corrección controlada</h2>
            <div className="notice">
              Este fichaje solo puede ajustarlo RRHH o administración. El historial de auditoría se reserva para gestión.
            </div>
          </section>
        )}
      </section>

      {canManage ? (
        <section className="panel stack">
          <h2 className="section-title">Auditoría</h2>
          <p className="meta">Cada corrección queda registrada con valores anteriores, nuevos valores, versión y autor.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Antes</th>
                  <th>Después</th>
                  <th>Motivo</th>
                  <th>Por</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id}>
                    <td>{formatDateTime(audit.createdAt)}</td>
                    <td>
                      {audit.previousDia} {audit.previousHora} {audit.previousTipo}
                    </td>
                    <td>
                      {audit.newDia} {audit.newHora} {audit.newTipo}
                    </td>
                    <td>{audit.reason}</td>
                    <td>
                      {audit.correctedByNombre} ({audit.correctedByNumero})
                    </td>
                  </tr>
                ))}
                {!audits.length ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Sin correcciones registradas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
