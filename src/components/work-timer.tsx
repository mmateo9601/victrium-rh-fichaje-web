'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { api, type WorkTimerCurrent } from '../lib/api/generated';

type WorkTimerProps = {
  token: string;
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatShortDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  }
  return `${minutes} min`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Sin registro';
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function WorkTimer({ token }: WorkTimerProps) {
  const [current, setCurrent] = useState<WorkTimerCurrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const snapshotAtRef = useRef(Date.now());

  async function loadCurrent() {
    try {
      const state = await api.timeEntries.current(token);
      setCurrent(state);
      snapshotAtRef.current = Date.now();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el estado de la jornada');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCurrent();
  }, [token]);

  useEffect(() => {
    const win = globalThis.window;
    const doc = globalThis.document;
    if (!win || !doc) {
      return undefined;
    }

    const interval = win.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    const handleVisibility = () => {
      if (doc.visibilityState === 'visible') {
        void loadCurrent();
      }
    };

    win.addEventListener('focus', handleVisibility);
    doc.addEventListener('visibilitychange', handleVisibility);

    return () => {
      win.clearInterval(interval);
      win.removeEventListener('focus', handleVisibility);
      doc.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [token]);

  const effectiveWorkedSeconds = useMemo(() => {
    if (!current) {
      return 0;
    }
    if (current.state === 'WORKING' && current.startedAt) {
      return current.workedSeconds + Math.max(0, Math.floor((now - snapshotAtRef.current) / 1000));
    }
    return current.workedSeconds;
  }, [current, now]);

  const effectiveBreakSeconds = useMemo(() => {
    if (!current) {
      return 0;
    }
    if (current.state === 'PAUSED' && current.activeBreak) {
      return current.breakSeconds + Math.max(0, Math.floor((now - snapshotAtRef.current) / 1000));
    }
    return current.breakSeconds;
  }, [current, now]);

  async function runAction(action: () => Promise<WorkTimerCurrent>, successMessage: string) {
    setActioning(true);
    setError(null);
    setMessage(null);
    try {
      const state = await action();
      setCurrent(state);
      snapshotAtRef.current = Date.now();
      setMessage(successMessage);
      setFinishConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la jornada');
    } finally {
      setActioning(false);
    }
  }

  const statusLabel =
    current?.state === 'WORKING'
      ? 'Trabajando'
      : current?.state === 'PAUSED'
        ? 'En pausa'
        : current?.state === 'COMPLETED'
          ? 'Jornada finalizada'
          : 'No iniciada';

  const statusTone =
    current?.state === 'WORKING' ? 'badge-success' : current?.state === 'PAUSED' ? 'badge-warning' : 'badge-info';

  if (loading) {
    return (
      <section className="panel stack work-timer">
        <div className="skeleton skeleton--line" style={{ width: '9rem' }} />
        <div className="skeleton skeleton--line" style={{ width: '18rem', height: '2.2rem' }} />
        <div className="skeleton skeleton--block" />
      </section>
    );
  }

  return (
    <section className="work-timer panel stack">
      <div className="toolbar">
        <div className="stack">
          <span className="eyebrow">Mi jornada</span>
          <h2 className="section-title">Cronómetro de trabajo</h2>
          <p className="meta">
            {current?.usuarioNombre ?? 'Sin usuario'} · {current?.companyName ?? 'Empresa global'}
          </p>
        </div>
        <span className={`badge ${statusTone}`}>{statusLabel}</span>
      </div>

      {error ? <div className="notice" role="alert">{error}</div> : null}
      {message ? <div className="notice" role="status">{message}</div> : null}

      <div className="work-timer__display">
        <strong>{formatDuration(effectiveWorkedSeconds)}</strong>
        <p>
          {current?.state === 'WORKING'
            ? `Trabajando desde ${formatDateTime(current.startedAt)}`
            : current?.state === 'PAUSED'
              ? `En pausa · ${formatShortDuration(effectiveBreakSeconds)}`
              : current?.state === 'COMPLETED'
                ? `Finalizada ${formatDateTime(current.finishedAt)}`
                : 'No has iniciado tu jornada'}
        </p>
      </div>

      <div className="work-timer__meta">
        <div className="stat">
          <strong>{formatShortDuration(effectiveBreakSeconds)}</strong>
          <span className="muted">Tiempo pausado</span>
        </div>
        <div className="stat">
          <strong>{formatDateTime(current?.startedAt)}</strong>
          <span className="muted">Inicio</span>
        </div>
        <div className="stat">
          <strong>{formatDateTime(current?.finishedAt)}</strong>
          <span className="muted">Fin</span>
        </div>
      </div>

      <div className="work-timer__actions">
        {current?.state === 'NOT_STARTED' || !current ? (
          <button
            className="button button-primary"
            type="button"
            onClick={() => void runAction(() => api.timeEntries.start(token, { origen: 'web' }), 'Jornada iniciada')}
            disabled={actioning}
          >
            Iniciar jornada
          </button>
        ) : null}

        {current?.state === 'WORKING' ? (
          <>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => void runAction(() => api.timeEntries.pause(token, current.sessionId ?? 0), 'Pausa registrada')}
              disabled={actioning || !current.sessionId}
            >
              Pausar
            </button>
            <button className="button button-danger" type="button" onClick={() => setFinishConfirmOpen(true)} disabled={actioning}>
              Finalizar
            </button>
          </>
        ) : null}

        {current?.state === 'PAUSED' ? (
          <>
            <button
              className="button button-primary"
              type="button"
              onClick={() => void runAction(() => api.timeEntries.resume(token, current.sessionId ?? 0), 'Jornada reanudada')}
              disabled={actioning || !current.sessionId}
            >
              Reanudar
            </button>
            <button className="button button-danger" type="button" onClick={() => setFinishConfirmOpen(true)} disabled={actioning}>
              Finalizar
            </button>
          </>
        ) : null}
      </div>

      {finishConfirmOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="finish-title">
            <h3 id="finish-title">Finalizar jornada</h3>
            <p>Has trabajado {formatDuration(effectiveWorkedSeconds)}. Esta acción cerrará la jornada actual.</p>
            <div className="hero-actions">
              <button className="button button-secondary" type="button" onClick={() => setFinishConfirmOpen(false)}>
                Cancelar
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={() => void runAction(() => api.timeEntries.finish(token, current?.sessionId ?? 0), 'Jornada finalizada')}
                disabled={actioning || !current?.sessionId}
              >
                Finalizar jornada
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
