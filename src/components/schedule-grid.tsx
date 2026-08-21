'use client';

import { formatDurationLabel, formatLongDate } from '../lib/labels';
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
