import type { TimeEntry } from './api/generated';
import { formatInputDate, formatLongDate, formatShortDate } from './labels';

export type WorkedDay = {
  date: string;
  label: string;
  minutes: number;
  entries: number;
};

export type WorkSummary = {
  workedMinutes: number;
  days: number;
  entries: number;
};

function toDateTime(entry: TimeEntry) {
  return new Date(`${entry.dia}T${entry.hora}`);
}

function getDayKey(date: Date) {
  return formatInputDate(date);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function buildWorkedSummary(entries: TimeEntry[], now = new Date()): WorkSummary {
  const sorted = [...entries].sort((left, right) => toDateTime(left).getTime() - toDateTime(right).getTime());
  const byUserAndDay = new Map<string, TimeEntry[]>();

  for (const entry of sorted) {
    const key = `${entry.usuarioId}:${entry.dia}`;
    const items = byUserAndDay.get(key) ?? [];
    items.push(entry);
    byUserAndDay.set(key, items);
  }

  let workedMinutes = 0;

  for (const items of byUserAndDay.values()) {
    for (let index = 0; index < items.length; index += 2) {
      const start = items[index];
      const end = items[index + 1];

      if (!start || start.tipo !== 'ENTRADA') {
        continue;
      }

      const startDate = toDateTime(start);
      const endDate = end && end.tipo === 'SALIDA' ? toDateTime(end) : now;
      workedMinutes += Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    }
  }

  return {
    workedMinutes,
    days: new Set(entries.map((entry) => entry.dia)).size,
    entries: entries.length
  };
}

export function buildWorkedDays(entries: TimeEntry[], days = 7, now = new Date()): WorkedDay[] {
  const end = startOfDay(now);
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (days - index - 1));
    return {
      date: getDayKey(date),
      label: formatShortDate(date),
      minutes: 0,
      entries: 0
    } satisfies WorkedDay;
  });

  const dayMap = new Map(series.map((item) => [item.date, item]));
  const byUserAndDay = new Map<string, TimeEntry[]>();

  for (const entry of entries) {
    if (!dayMap.has(entry.dia)) {
      continue;
    }
    const key = `${entry.usuarioId}:${entry.dia}`;
    const current = byUserAndDay.get(key) ?? [];
    current.push(entry);
    byUserAndDay.set(key, current);
  }

  for (const items of byUserAndDay.values()) {
    const ordered = [...items].sort((left, right) => toDateTime(left).getTime() - toDateTime(right).getTime());
    const dayKey = ordered[0]?.dia;
    const item = dayKey ? dayMap.get(dayKey) : null;
    if (!item) {
      continue;
    }

    item.entries += ordered.length;
    for (let index = 0; index < ordered.length; index += 2) {
      const start = ordered[index];
      const end = ordered[index + 1];
      if (!start || start.tipo !== 'ENTRADA' || !end || end.tipo !== 'SALIDA') {
        continue;
      }

      item.minutes += Math.max(0, Math.round((toDateTime(end).getTime() - toDateTime(start).getTime()) / 60000));
    }
  }

  return series;
}

export function getWeekRangeLabel() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  return `${formatLongDate(start)} - ${formatLongDate(today)}`;
}

