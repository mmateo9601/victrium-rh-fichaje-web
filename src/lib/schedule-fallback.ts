import type { Employee, Schedule, Shift, ShiftAssignment, ShiftDay } from './api/generated';

function dayOfWeek(date: string) {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

function addDays(date: string, offset: number) {
  const cursor = new Date(`${date}T12:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() + offset);
  return cursor.toISOString().slice(0, 10);
}

function dayLabel(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace('.', '');
}

function timeToMinutes(time: string | null | undefined) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function diffMinutes(start: string | null | undefined, end: string | null | undefined, crossesMidnight: boolean) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    return 0;
  }

  return Math.max(0, crossesMidnight || endMinutes <= startMinutes ? endMinutes + 24 * 60 - startMinutes : endMinutes - startMinutes);
}

function normalizeShiftDay(day: ShiftDay | undefined) {
  if (!day) {
    return null;
  }

  return {
    working: day.working,
    startTime: day.startTime ?? null,
    endTime: day.endTime ?? null,
    breakMinutes: day.breakMinutes,
    workingMinutes: day.workingMinutes ?? null,
    crossesMidnight: day.crossesMidnight
  };
}

function rangeDays(from: string, to: string) {
  const days: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

function pickAssignment(date: string, assignments: ShiftAssignment[]) {
  return (
    [...assignments]
      .filter((assignment) => assignment.active && assignment.validFrom <= date && (assignment.validTo === null || assignment.validTo === undefined || assignment.validTo >= date))
      .sort((left, right) => right.validFrom.localeCompare(left.validFrom) || right.id - left.id)[0] ?? null
  );
}

function resolveShiftForDate(date: string, assignments: ShiftAssignment[], shiftsById: Map<number, Shift>) {
  const assignment = pickAssignment(date, assignments);
  if (!assignment) {
    return { assignment: null, shift: null, shiftDay: null };
  }

  const shift = shiftsById.get(assignment.shift.id) ?? null;
  const shiftDay = normalizeShiftDay(shift?.days?.find((day) => day.dayOfWeek === dayOfWeek(date)));
  return { assignment, shift, shiftDay };
}

export function buildFallbackEmployeeSchedule(
  employee: Employee,
  range: { from: string; to: string },
  assignments: ShiftAssignment[],
  shifts: Shift[]
): Schedule {
  const shiftsById = new Map(shifts.map((shift) => [shift.id, shift] as const));
  const days = rangeDays(range.from, range.to).map((date) => ({
    date,
    dayOfWeek: dayOfWeek(date),
    label: dayLabel(date)
  }));

  const rowDays = days.map((day) => {
    const { assignment, shift, shiftDay } = resolveShiftForDate(day.date, assignments, shiftsById);
    const workingDay = Boolean(shiftDay?.working);
    const status: Schedule['rows'][number]['days'][number]['status'] = assignment ? (workingDay ? 'WORKING' : 'OFF') : 'NO_SHIFT';
    const expectedMinutes = workingDay
      ? shiftDay?.workingMinutes ?? diffMinutes(shiftDay?.startTime, shiftDay?.endTime, Boolean(shiftDay?.crossesMidnight))
      : 0;

    return {
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      workingDay,
      isHoliday: false,
      status,
      statusLabel: assignment ? (workingDay ? shift?.name ?? 'Turno' : 'Libre') : 'Sin turno',
      shift: assignment && shift ? { id: shift.id, name: shift.name, code: shift.code, color: shift.color ?? null } : null,
      workLocationId: assignment?.workLocationId ?? null,
      workLocationName: assignment?.workLocationName ?? null,
      workLocationCode: assignment?.workLocationCode ?? null,
      workLocationSource: assignment ? 'assignment' : null,
      assignmentId: assignment?.id ?? null,
      overrideId: null,
      overrideKind: null,
      overrideType: null,
      employmentTermsId: null,
      employmentTermsContractType: null,
      employmentTermsWeeklyContractMinutes: null,
      employmentTermsAnnualContractMinutes: null,
      employmentTermsWorkingPercentage: null,
      expectedStart: workingDay ? shiftDay?.startTime ?? null : null,
      expectedEnd: workingDay ? shiftDay?.endTime ?? null : null,
      expectedMinutes,
      breakMinutes: workingDay ? shiftDay?.breakMinutes ?? 0 : 0,
      workedMinutes: 0,
      differenceMinutes: 0,
      lateMinutes: 0,
      vacationId: null,
      permissionId: null,
      incidentId: null,
      firstEntry: null,
      lastExit: null,
      policy: null
    } as Schedule['rows'][number]['days'][number];
  });

  const workingCells = rowDays.filter((cell) => cell.workingDay);
  const plannedMinutes = workingCells.reduce((total, cell) => total + cell.expectedMinutes, 0);

  return {
    from: range.from,
    to: range.to,
    employees: [
      {
        employeeId: employee.id,
        employeeNumero: employee.numero,
        employeeNombre: employee.nombreEmpleado,
        companyId: employee.companyId ?? null,
        companyName: employee.companyName ?? null
      }
    ],
    days,
    summary: {
      rangeDays: days.length,
      plannedMinutes,
      workedMinutes: 0,
      coverageRate: 0,
      plannedDays: workingCells.length,
      workedDays: 0,
      absenceDays: 0,
      incidentDays: 0,
      unplannedDays: workingCells.filter((cell) => cell.status === 'NO_SHIFT').length,
      weeklyTargetMinutes: null,
      monthlyTargetMinutes: null,
      targetMinutes: null,
      targetLabel: null,
      remainingMinutes: null,
      progressRate: null
    },
    rows: [
      {
        employeeId: employee.id,
        employeeNumero: employee.numero,
        employeeNombre: employee.nombreEmpleado,
        companyId: employee.companyId ?? null,
        companyName: employee.companyName ?? null,
        days: rowDays
      }
    ]
  };
}
