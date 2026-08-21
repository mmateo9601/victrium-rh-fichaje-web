import type { EventInput } from '@fullcalendar/core';

import type {
  Calendar,
  Incident,
  PlanningPeriod,
  Permission,
  Schedule,
  TimeEntry,
  Vacation
} from './api/generated';
import { formatDurationLabel, formatLongDate } from './labels';

export type WorkforceCalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth' | 'multiMonthYear';

export type WorkforceCalendarKind =
  | 'shift'
  | 'vacation'
  | 'permission'
  | 'holiday'
  | 'time-entry'
  | 'calendar-day'
  | 'incident'
  | 'planning-period'
  | 'schedule';

export type WorkforceCalendarDetail = {
  label: string;
  value: string;
};

export type WorkforceCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string | null;
  allDay?: boolean;
  kind: WorkforceCalendarKind;
  subtitle?: string;
  location?: string | null;
  statusLabel?: string | null;
  summary?: string | null;
  description?: string | null;
  color?: string | null;
  borderColor?: string | null;
  textColor?: string | null;
  details?: WorkforceCalendarDetail[];
};

export type WorkforceCalendarRange = {
  from: string;
  to: string;
};

export type CalendarLegendItem = {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
};

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatLocalDateInput(date);
}

function combineDateAndTime(date: string, time: string) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

function formatLocalDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function colorForKind(kind: WorkforceCalendarKind) {
  switch (kind) {
    case 'shift':
      return { color: '#0f766e', borderColor: '#0b5f58', textColor: '#ffffff' };
    case 'vacation':
      return { color: '#2f6fed', borderColor: '#245ad1', textColor: '#ffffff' };
    case 'permission':
      return { color: '#b7791f', borderColor: '#946316', textColor: '#ffffff' };
    case 'holiday':
      return { color: '#b42318', borderColor: '#8f1b12', textColor: '#ffffff' };
    case 'incident':
      return { color: '#7c3aed', borderColor: '#6d28d9', textColor: '#ffffff' };
    case 'time-entry':
      return { color: '#334155', borderColor: '#0f172a', textColor: '#ffffff' };
    case 'planning-period':
      return { color: '#0f172a', borderColor: '#0f172a', textColor: '#ffffff' };
    default:
      return { color: '#526171', borderColor: '#334155', textColor: '#ffffff' };
  }
}

function buildEvent(event: WorkforceCalendarEvent): EventInput {
  const colors = event.color || event.borderColor || event.textColor ? null : colorForKind(event.kind);
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end ?? undefined,
    allDay: event.allDay ?? false,
    backgroundColor: event.color ?? colors?.color,
    borderColor: event.borderColor ?? colors?.borderColor,
    textColor: event.textColor ?? colors?.textColor,
    extendedProps: {
      kind: event.kind,
      subtitle: event.subtitle ?? null,
      location: event.location ?? null,
      statusLabel: event.statusLabel ?? null,
      summary: event.summary ?? null,
      description: event.description ?? null,
      details: event.details ?? []
    }
  };
}

export function toEventInput(event: WorkforceCalendarEvent): EventInput {
  return buildEvent(event);
}

export function formatRangeLabel(from: string, to: string) {
  return `${formatLongDate(from)} - ${formatLongDate(to)}`;
}

export function toInclusiveRange(start: Date, end: Date): WorkforceCalendarRange {
  const inclusiveEnd = new Date(end);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  return {
    from: formatLocalDateInput(start),
    to: formatLocalDateInput(inclusiveEnd)
  };
}

export function buildScheduleEvents(
  schedule: Schedule,
  options: { employeeId?: number; showNonWorking?: boolean } = {}
) {
  const events: WorkforceCalendarEvent[] = [];

  for (const row of schedule.rows) {
    if (options.employeeId && row.employeeId !== options.employeeId) {
      continue;
    }

    for (const cell of row.days) {
      if (cell.status === 'WORKING' && cell.shift && cell.expectedStart && cell.expectedEnd) {
        const crossesMidnight = cell.expectedEnd <= cell.expectedStart;
        const endDate = crossesMidnight ? addDays(cell.date, 1) : cell.date;
        events.push({
          id: `schedule-${row.employeeId}-${cell.date}`,
          title: cell.shift.name,
          start: combineDateAndTime(cell.date, cell.expectedStart),
          end: combineDateAndTime(endDate, cell.expectedEnd),
          kind: 'shift',
          subtitle: row.employeeNombre,
          location: row.companyName,
          statusLabel: cell.statusLabel,
          summary: cell.shift.code,
          description: cell.policy?.configured ? 'Política laboral aplicada' : 'Sin política configurada',
          details: [
            { label: 'Empleado', value: `${row.employeeNombre} · ${row.employeeNumero}` },
            { label: 'Horario', value: `${cell.expectedStart.slice(0, 5)} - ${cell.expectedEnd.slice(0, 5)}` },
            { label: 'Previsto', value: formatDurationLabel(cell.expectedMinutes) },
            { label: 'Realizado', value: formatDurationLabel(cell.workedMinutes) },
            { label: 'Diferencia', value: formatDurationLabel(Math.abs(cell.differenceMinutes)) },
            { label: 'Entrada real', value: cell.firstEntry ? cell.firstEntry.slice(0, 5) : 'Sin registro' },
            { label: 'Salida real', value: cell.lastExit ? cell.lastExit.slice(0, 5) : 'Sin registro' }
          ]
        });
        continue;
      }

      if (!options.showNonWorking) {
        continue;
      }

      if (cell.status === 'VACATION') {
        events.push({
          id: `vacation-${row.employeeId}-${cell.date}`,
          title: 'Vacaciones',
          start: cell.date,
          end: addDays(cell.date, 1),
          allDay: true,
          kind: 'vacation',
          subtitle: row.employeeNombre,
          summary: row.companyName,
          statusLabel: cell.statusLabel,
          details: [
            { label: 'Empleado', value: `${row.employeeNombre} · ${row.employeeNumero}` },
            { label: 'Empresa', value: row.companyName ?? 'Global' },
            { label: 'Día', value: formatLongDate(cell.date) }
          ]
        });
      } else if (cell.status === 'PERMISSION') {
        events.push({
          id: `permission-${row.employeeId}-${cell.date}`,
          title: 'Permiso',
          start: cell.date,
          end: addDays(cell.date, 1),
          allDay: true,
          kind: 'permission',
          subtitle: row.employeeNombre,
          summary: row.companyName,
          statusLabel: cell.statusLabel,
          details: [
            { label: 'Empleado', value: `${row.employeeNombre} · ${row.employeeNumero}` },
            { label: 'Empresa', value: row.companyName ?? 'Global' },
            { label: 'Día', value: formatLongDate(cell.date) }
          ]
        });
      } else if (cell.status === 'HOLIDAY') {
        events.push({
          id: `holiday-${row.employeeId}-${cell.date}`,
          title: 'Festivo',
          start: cell.date,
          end: addDays(cell.date, 1),
          allDay: true,
          kind: 'holiday',
          subtitle: row.employeeNombre,
          summary: row.companyName,
          statusLabel: cell.statusLabel,
          details: [
            { label: 'Empleado', value: `${row.employeeNombre} · ${row.employeeNumero}` },
            { label: 'Empresa', value: row.companyName ?? 'Global' },
            { label: 'Día', value: formatLongDate(cell.date) }
          ]
        });
      } else if (cell.status === 'OFF') {
        events.push({
          id: `off-${row.employeeId}-${cell.date}`,
          title: 'Libre',
          start: cell.date,
          end: addDays(cell.date, 1),
          allDay: true,
          kind: 'schedule',
          subtitle: row.employeeNombre,
          summary: row.companyName,
          statusLabel: cell.statusLabel
        });
      }
    }
  }

  return events;
}

export function buildVacationEvents(vacations: Vacation[]) {
  return vacations.map((vacation) => ({
    id: `vacation-${vacation.id}`,
    title: vacation.aprobado ? 'Vacaciones aprobadas' : 'Vacaciones',
    start: vacation.inicio,
    end: addDays(vacation.fin, 1),
    allDay: true,
    kind: 'vacation' as const,
    subtitle: vacation.employeeNombre ?? vacation.employeeNumero ?? undefined,
    summary: vacation.companyName ?? 'Global',
    statusLabel: vacation.estado,
    details: [
      { label: 'Empleado', value: vacation.employeeNombre ?? vacation.employeeNumero ?? 'Sin empleado' },
      { label: 'Empresa', value: vacation.companyName ?? 'Global' },
      { label: 'Inicio', value: formatLongDate(vacation.inicio) },
      { label: 'Fin', value: formatLongDate(vacation.fin) },
      { label: 'Estado', value: vacation.estado }
    ]
  })) satisfies WorkforceCalendarEvent[];
}

export function buildPermissionEvents(permissions: Permission[]) {
  return permissions.map((permission) => ({
    id: `permission-${permission.id}`,
    title: permission.descripcion,
    start: combineDateAndTime(permission.dia, permission.horaInicio),
    end: combineDateAndTime(permission.dia, permission.horaFin),
    allDay: false,
    kind: 'permission' as const,
    subtitle: permission.employeeNombre ?? permission.employeeNumero ?? undefined,
    summary: permission.companyName ?? 'Global',
    statusLabel: permission.estado,
    details: [
      { label: 'Empleado', value: permission.employeeNombre ?? permission.employeeNumero ?? 'Sin empleado' },
      { label: 'Empresa', value: permission.companyName ?? 'Global' },
      { label: 'Día', value: formatLongDate(permission.dia) },
      { label: 'Horario', value: `${permission.horaInicio} - ${permission.horaFin}` },
      { label: 'Estado', value: permission.estado }
    ]
  })) satisfies WorkforceCalendarEvent[];
}

export function buildTimeEntryEvents(entries: TimeEntry[]) {
  return entries.map((entry) => ({
    id: `time-entry-${entry.id}`,
    title: entry.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
    start: combineDateAndTime(entry.dia, entry.hora),
    end: undefined,
    allDay: false,
    kind: 'time-entry' as const,
    subtitle: entry.usuarioNombre,
    summary: entry.companyName ?? 'General',
    statusLabel: entry.origen,
    details: [
      { label: 'Empleado', value: entry.usuarioNombre },
      { label: 'Número', value: entry.usuarioNumero },
      { label: 'Empresa', value: entry.companyName ?? 'General' },
      { label: 'Fecha', value: formatLongDate(entry.dia) },
      { label: 'Hora', value: entry.hora.slice(0, 5) },
      { label: 'Origen', value: entry.origen }
    ]
  })) satisfies WorkforceCalendarEvent[];
}

export function buildCalendarEvents(calendar: Calendar) {
  return calendar.days.map((day) => {
    const isHoliday = day.horaInicio === '00:00:00' && day.horaFin === '00:00:00';
    return {
      id: `calendar-day-${calendar.id}-${day.dia}`,
      title: isHoliday ? 'Festivo' : 'Laborable',
      start: day.dia,
      end: addDays(day.dia, 1),
      allDay: true,
      kind: isHoliday ? 'holiday' : 'calendar-day',
      subtitle: calendar.nombre,
      summary: String(calendar.year),
      statusLabel: isHoliday ? 'Festivo' : 'Laborable',
      details: [
        { label: 'Calendario', value: calendar.nombre },
        { label: 'Año', value: String(calendar.year) },
        { label: 'Día', value: formatLongDate(day.dia) },
        { label: 'Horario', value: isHoliday ? 'Festivo' : `${day.horaInicio.slice(0, 5)} - ${day.horaFin.slice(0, 5)}` }
      ]
    } satisfies WorkforceCalendarEvent;
  });
}

export function buildIncidentEvents(incidents: Incident[]) {
  return incidents.map((incident) => ({
    id: `incident-${incident.id}`,
    title: incident.resumen,
    start: incident.dia,
    end: addDays(incident.dia, 1),
    allDay: true,
    kind: 'incident' as const,
    subtitle: incident.employeeNombre ?? incident.employeeNumero ?? undefined,
    summary: incident.companyName ?? 'Global',
    statusLabel: incident.resuelta ? 'Cerrada' : 'Abierta',
    details: [
      { label: 'Empleado', value: incident.employeeNombre ?? incident.employeeNumero ?? 'Sin empleado' },
      { label: 'Empresa', value: incident.companyName ?? 'Global' },
      { label: 'Fecha', value: formatLongDate(incident.dia) },
      { label: 'Estado', value: incident.resuelta ? 'Cerrada' : 'Abierta' },
      { label: 'Descripción', value: incident.descripcion }
    ]
  })) satisfies WorkforceCalendarEvent[];
}

export function buildPlanningPeriodEvents(periods: PlanningPeriod[]) {
  return periods.map((period) => ({
    id: `planning-period-${period.id}`,
    title: period.name,
    start: period.startDate,
    end: addDays(period.endDate, 1),
    allDay: true,
    kind: 'planning-period' as const,
    subtitle: period.companyName ?? undefined,
    statusLabel: period.status,
    details: [
      { label: 'Periodo', value: period.name },
      { label: 'Inicio', value: formatLongDate(period.startDate) },
      { label: 'Fin', value: formatLongDate(period.endDate) },
      { label: 'Estado', value: period.status }
    ]
  })) satisfies WorkforceCalendarEvent[];
}
