'use client';

import { formatDurationLabel, formatLongDate, formatNumber } from '../lib/labels';
import type { Schedule } from '../lib/api/generated';

type ScheduleGridProps = {
  schedule: Schedule;
  compact?: boolean;
};

function cellTone(status: string) {
  switch (status) {
    case 'WORKING':
      return 'badge-success';
    case 'VACATION':
      return 'badge-info';
    case 'PERMISSION':
      return 'badge-warning';
    case 'HOLIDAY':
      return 'badge-danger';
    case 'OFF':
      return 'badge-neutral';
    default:
      return 'badge-neutral';
  }
}

function shortTime(value: string | null) {
  if (!value) return '—';
  return value.slice(0, 5);
}

export function ScheduleGrid({ schedule, compact }: ScheduleGridProps) {
  const targetLabel =
    schedule.summary.targetLabel === 'weekly'
      ? 'Objetivo semanal'
      : schedule.summary.targetLabel === 'monthly'
        ? 'Objetivo mensual'
        : 'Objetivo del periodo';

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="stack" style={{ gap: '0.25rem' }}>
          <span className="eyebrow">Planificación</span>
          <h2 className="section-title">
            {formatLongDate(schedule.from)} - {formatLongDate(schedule.to)}
          </h2>
        </div>
        <div className="hero-actions" style={{ marginTop: 0 }}>
          {compact ? null : (
            <>
              <span className="badge badge-success">Turno</span>
              <span className="badge badge-info">Vacaciones</span>
              <span className="badge badge-warning">Permiso</span>
              <span className="badge badge-danger">Festivo</span>
            </>
          )}
        </div>
      </div>

      <section className="grid-3">
        <article className="stat">
          <strong>{formatDurationLabel(schedule.summary.targetMinutes ?? 0)}</strong>
          <span className="muted">{targetLabel}</span>
        </article>
        <article className="stat">
          <strong>{formatDurationLabel(schedule.summary.workedMinutes)}</strong>
          <span className="muted">Realizado</span>
        </article>
        <article className="stat">
          <strong>{formatNumber(schedule.summary.coverageRate)}%</strong>
          <span className="muted">Cobertura</span>
        </article>
        <article className="stat">
          <strong>{formatNumber(schedule.summary.plannedDays)}</strong>
          <span className="muted">Días planificados</span>
        </article>
        <article className="stat">
          <strong>{formatNumber(schedule.summary.workedDays)}</strong>
          <span className="muted">Días con actividad</span>
        </article>
        <article className="stat">
          <strong>{formatDurationLabel(schedule.summary.remainingMinutes ?? 0)}</strong>
          <span className="muted">{schedule.summary.remainingMinutes !== null ? 'Restante' : 'Sin objetivo'}</span>
        </article>
      </section>

      <section className="grid-3">
        <article className="stat stat--compact">
          <strong>{formatDurationLabel(schedule.summary.weeklyTargetMinutes ?? 0)}</strong>
          <span className="muted">Meta semanal</span>
        </article>
        <article className="stat stat--compact">
          <strong>{formatDurationLabel(schedule.summary.monthlyTargetMinutes ?? 0)}</strong>
          <span className="muted">Meta mensual</span>
        </article>
        <article className="stat stat--compact">
          <strong>{formatNumber(schedule.summary.absenceDays)}</strong>
          <span className="muted">Ausencias</span>
        </article>
      </section>

      <div className="table-wrap schedule-wrap">
        <table className="table schedule-table">
          <thead>
            <tr>
              <th className="schedule-table__sticky">Empleado</th>
              {schedule.days.map((day) => (
                <th key={day.date}>
                  <div className="schedule-day">
                    <strong>{day.label}</strong>
                    <span className="muted">{day.date}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.rows.map((row) => (
              <tr key={row.employeeId}>
                <th className="schedule-table__sticky" scope="row">
                  <div className="stack" style={{ gap: '0.2rem' }}>
                    <strong>{row.employeeNombre}</strong>
                    <span className="muted">{row.employeeNumero}</span>
                  </div>
                </th>
                {row.days.map((cell) => (
                  <td key={`${row.employeeId}-${cell.date}`}>
                    <div className="schedule-cell">
                      <span className={`badge ${cellTone(cell.status)}`}>{cell.statusLabel}</span>
                      <strong>{cell.shift ? cell.shift.code : cell.status === 'WORKING' ? 'Turno' : 'Libre'}</strong>
                      <span className="muted">
                        {cell.expectedStart && cell.expectedEnd ? `${shortTime(cell.expectedStart)} - ${shortTime(cell.expectedEnd)}` : 'Sin horario'}
                      </span>
                      <span className="muted">
                        {cell.expectedMinutes ? formatDurationLabel(cell.expectedMinutes) : '0 min'}
                        {cell.workedMinutes ? ` · real ${formatDurationLabel(cell.workedMinutes)}` : ''}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
