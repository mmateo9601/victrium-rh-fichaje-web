'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Pause, Play, SquareCheckBig, TimerReset } from 'lucide-react';

import { api, type WorkTimerCurrent } from '../lib/api/generated';
import { formatClock, formatDateTime, formatDurationLabel } from '../lib/labels';

type WorkTimerProps = {
  token: string;
};

function formatNowTime(value: number) {
  return new Intl.DateTimeFormat('es-ES', {
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

  const currentTimeLabel = useMemo(() => formatNowTime(now), [now]);

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
    current?.state === 'WORKING'
      ? 'badge-success'
      : current?.state === 'PAUSED'
        ? 'badge-warning'
        : current?.state === 'COMPLETED'
          ? 'badge-info'
          : 'badge-info';

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
          <h2 className="section-title">Cronómetro principal</h2>
          <p className="meta">
            {current?.usuarioNombre ?? 'Sin usuario'} · {current?.companyName ?? 'Empresa general'}
          </p>
        </div>
        <span className={`badge ${statusTone}`}>{statusLabel}</span>
      </div>

      {error ? (
        <div className="notice notice--error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}
      {message ? <div className="notice" role="status">{message}</div> : null}

      <div className={`work-timer__hero ${current?.state === 'PAUSED' ? 'is-paused' : ''}`}>
        <div className="work-timer__hero-head">
          <span className="work-timer__eyebrow">{current?.state === 'PAUSED' ? 'EN PAUSA' : 'TIEMPO EFECTIVO'}</span>
          <span className="work-timer__clock-caption">{currentTimeLabel}</span>
        </div>
        <strong className="work-timer__clock">{formatClock(effectiveWorkedSeconds)}</strong>
        <p className="work-timer__hero-copy">
          {current?.state === 'WORKING'
            ? `En marcha desde ${formatDateTime(current.startedAt)}`
            : current?.state === 'PAUSED'
              ? `Pausa actual de ${formatDurationLabel(Math.round(effectiveBreakSeconds / 60))}`
              : current?.state === 'COMPLETED'
                ? `Jornada finalizada el ${formatDateTime(current.finishedAt)}`
                : 'Todavía no has iniciado la jornada de hoy.'}
        </p>

        <div className="work-timer__status-grid">
          <article className="work-timer__status">
            <span className="muted">Entrada</span>
            <strong>{formatDateTime(current?.startedAt)}</strong>
          </article>
          <article className="work-timer__status">
            <span className="muted">Pausa</span>
            <strong>{formatDurationLabel(Math.round(effectiveBreakSeconds / 60))}</strong>
          </article>
          <article className="work-timer__status">
            <span className="muted">Salida</span>
            <strong>{formatDateTime(current?.finishedAt)}</strong>
          </article>
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
            <Play size={16} />
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
              <Pause size={16} />
              Pausar
            </button>
            <button className="button button-danger" type="button" onClick={() => setFinishConfirmOpen(true)} disabled={actioning}>
              <SquareCheckBig size={16} />
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
              <Play size={16} />
              Reanudar
            </button>
            <button className="button button-danger" type="button" onClick={() => setFinishConfirmOpen(true)} disabled={actioning}>
              <SquareCheckBig size={16} />
              Finalizar
            </button>
          </>
        ) : null}

        {current?.state === 'COMPLETED' ? (
          <div className="work-timer__completed">
            <TimerReset size={16} />
            <span>Jornada cerrada</span>
          </div>
        ) : null}
      </div>

      {finishConfirmOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="finish-title">
            <h3 id="finish-title">Finalizar jornada</h3>
            <p>Has trabajado {formatClock(effectiveWorkedSeconds)}. Esta acción cerrará la jornada actual.</p>
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
