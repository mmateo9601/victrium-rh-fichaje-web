'use client';

import type { ShiftRotationStep } from '../lib/api/generated';

export type RotationPatternStep = Omit<ShiftRotationStep, 'id'>;

type RotationPatternEditorProps = {
  value: RotationPatternStep[];
  onChange: (next: RotationPatternStep[]) => void;
  title?: string;
  description?: string;
};

function createEmptyStep(): RotationPatternStep {
  return {
    working: true,
    startTime: '08:00:00',
    endTime: '16:00:00',
    breakMinutes: 30,
    workingMinutes: 450,
    crossesMidnight: false
  };
}

function formatStep(step: RotationPatternStep) {
  if (!step.working) {
    return 'Libre';
  }

  const start = step.startTime?.slice(0, 5) ?? '—';
  const end = step.endTime?.slice(0, 5) ?? '—';
  const breakMinutes = step.breakMinutes ? ` · Descanso ${step.breakMinutes} min` : '';
  const midnight = step.crossesMidnight ? ' · Cruza medianoche' : '';
  return `${start} - ${end}${breakMinutes}${midnight}`;
}

function clampMinutes(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
}

function normalizeTime(value: string | null) {
  return value && value.trim() ? value : null;
}

export function createRotationPatternStep(): RotationPatternStep {
  return createEmptyStep();
}

export function RotationPatternEditor({ value, onChange, title = 'Patrón de rotación', description = 'Organiza el ciclo en pasos visuales. Puedes añadir, duplicar, reordenar o eliminar pasos.' }: RotationPatternEditorProps) {
  function updateStep(index: number, patch: Partial<RotationPatternStep>) {
    onChange(
      value.map((step, currentIndex) =>
        currentIndex === index
          ? {
              ...step,
              ...patch,
              ...(patch.working === false ? { startTime: null, endTime: null, crossesMidnight: false, workingMinutes: 0 } : null),
              startTime: patch.startTime !== undefined ? normalizeTime(patch.startTime) : step.startTime,
              endTime: patch.endTime !== undefined ? normalizeTime(patch.endTime) : step.endTime,
              breakMinutes: patch.breakMinutes !== undefined ? clampMinutes(patch.breakMinutes) : step.breakMinutes,
              workingMinutes: patch.workingMinutes !== undefined ? clampMinutes(patch.workingMinutes ?? 0) : step.workingMinutes
            }
          : step
      )
    );
  }

  function addStep() {
    onChange([...value, createEmptyStep()]);
  }

  function duplicateStep(index: number) {
    const step = value[index];
    if (!step) {
      return;
    }
    onChange([...value.slice(0, index + 1), { ...step }, ...value.slice(index + 1)]);
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) {
      return;
    }

    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function removeStep(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <section className="rotation-editor stack">
      <div className="toolbar">
        <div>
          <h3 className="section-title">{title}</h3>
          <p className="meta">{description}</p>
        </div>
        <button className="button button-secondary" type="button" onClick={addStep}>
          Añadir paso
        </button>
      </div>

      {value.length ? (
        <div className="rotation-editor__list">
          {value.map((step, index) => (
            <article className="rotation-step" key={`${step.working ? 'work' : 'off'}-${index}`}>
              <div className="rotation-step__header">
                <div>
                  <strong>Paso {index + 1}</strong>
                  <p className="meta">{formatStep(step)}</p>
                </div>
                <div className="rotation-step__actions">
                  <button className="button button-secondary" type="button" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                    Subir
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => moveStep(index, 1)} disabled={index === value.length - 1}>
                    Bajar
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => duplicateStep(index)}>
                    Duplicar
                  </button>
                  <button className="button button-danger" type="button" onClick={() => removeStep(index)}>
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label>Trabaja</label>
                  <select
                    value={String(step.working)}
                    onChange={(event) =>
                      updateStep(index, {
                        working: event.target.value === 'true',
                        ...(event.target.value === 'true'
                          ? {}
                          : { startTime: null, endTime: null, workingMinutes: 0, crossesMidnight: false })
                      })
                    }
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="field">
                  <label>Inicio</label>
                  <input type="time" value={step.startTime?.slice(0, 5) ?? ''} onChange={(event) => updateStep(index, { startTime: event.target.value ? `${event.target.value}:00` : null })} disabled={!step.working} />
                </div>
                <div className="field">
                  <label>Fin</label>
                  <input type="time" value={step.endTime?.slice(0, 5) ?? ''} onChange={(event) => updateStep(index, { endTime: event.target.value ? `${event.target.value}:00` : null })} disabled={!step.working} />
                </div>
                <div className="field">
                  <label>Descanso</label>
                  <input type="number" min={0} value={step.breakMinutes} onChange={(event) => updateStep(index, { breakMinutes: Number(event.target.value) })} />
                </div>
                <div className="field">
                  <label>Min. útiles</label>
                  <input type="number" min={0} value={step.workingMinutes ?? 0} onChange={(event) => updateStep(index, { workingMinutes: Number(event.target.value) })} />
                </div>
                <div className="field">
                  <label>Medianoche</label>
                  <select value={String(step.crossesMidnight)} onChange={(event) => updateStep(index, { crossesMidnight: event.target.value === 'true' })} disabled={!step.working}>
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Sin pasos</strong>
          <p className="meta">Añade un paso para definir un ciclo rotativo.</p>
        </div>
      )}
    </section>
  );
}
