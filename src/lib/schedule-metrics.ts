import type { Schedule } from './api/generated';

export type ScheduleMetrics = {
  plannedMinutes: number;
  workedMinutes: number;
  coverageRate: number;
  plannedDays: number;
  workedDays: number;
  absenceDays: number;
  incidentDays: number;
  unplannedDays: number;
};

export function buildMonthRange(reference: Date = new Date()) {
  const from = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return { from, to };
}

export function summarizeSchedule(schedule: Schedule): ScheduleMetrics {
  const cells = schedule.rows.flatMap((row) => row.days);
  const workingCells = cells.filter((cell) => cell.workingDay);
  const plannedMinutes = workingCells.reduce((total, cell) => total + cell.expectedMinutes, 0);
  const workedMinutes = workingCells.reduce((total, cell) => total + cell.workedMinutes, 0);

  return {
    plannedMinutes,
    workedMinutes,
    coverageRate: plannedMinutes > 0 ? Number(((workedMinutes / plannedMinutes) * 100).toFixed(1)) : 0,
    plannedDays: workingCells.length,
    workedDays: workingCells.filter((cell) => cell.workedMinutes > 0).length,
    absenceDays: cells.filter((cell) => cell.status === 'VACATION' || cell.status === 'PERMISSION').length,
    incidentDays: cells.filter((cell) => cell.incidentId !== null).length,
    unplannedDays: workingCells.filter((cell) => cell.status === 'NO_SHIFT' || cell.assignmentId === null).length
  };
}
