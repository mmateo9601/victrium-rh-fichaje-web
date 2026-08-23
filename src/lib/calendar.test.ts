import { describe, expect, it } from 'vitest';

import type {
  Calendar,
  CalendarDay,
  Permission,
  PlanningPeriod,
  Schedule,
  ScheduleCell,
  TimeEntry,
  Vacation
} from './api/generated';
import {
  buildCalendarEvents,
  buildPermissionEvents,
  buildPlanningPeriodEvents,
  buildScheduleEvents,
  buildTimeEntryEvents,
  buildVacationEvents,
  toInclusiveRange
} from './calendar';

const basePolicy = {
  configured: true,
  maxDailyMinutes: 480,
  minimumBreakMinutes: 30,
  lateThresholdMinutes: 10,
  overtimeWarningMinutes: 30,
  nightWorkStart: null,
  nightWorkEnd: null,
  expectedBreakMinutes: 30,
  actualBreakMinutes: 30,
  overtimeMinutes: 0,
  nightWorkMinutes: 0,
  warnings: [] as string[],
  violations: [] as string[]
};

const baseCell: ScheduleCell = {
  date: '2026-08-21',
  dayOfWeek: 5,
  label: 'Vie',
  workingDay: true,
  isHoliday: false,
  status: 'WORKING',
  statusLabel: 'Turno mañana',
  shift: {
    id: 1,
    name: 'Mañana',
    code: 'M',
    color: '#2f6fed'
  },
  workLocationId: 11,
  workLocationName: 'Madrid Centro',
  workLocationCode: 'MAD-CENTRO',
  workLocationSource: 'assignment',
  assignmentId: 10,
  overrideId: null,
  overrideKind: null,
  employmentTermsId: 21,
  employmentTermsContractType: 'FULL_TIME',
  employmentTermsWeeklyContractMinutes: 2400,
  employmentTermsAnnualContractMinutes: 86400,
  employmentTermsWorkingPercentage: '100.00',
  expectedStart: '08:00:00',
  expectedEnd: '16:00:00',
  expectedMinutes: 480,
  breakMinutes: 30,
  workedMinutes: 450,
  differenceMinutes: -30,
  lateMinutes: 5,
  vacationId: null,
  permissionId: null,
  incidentId: null,
  firstEntry: '08:05:00',
  lastExit: '15:50:00',
  policy: basePolicy
};

function cell(overrides: Partial<ScheduleCell>): ScheduleCell {
  return {
    ...baseCell,
    ...overrides,
    shift: overrides.shift === undefined ? baseCell.shift : overrides.shift
  };
}

describe('calendar builders', () => {
  it('builds schedule events with working and non-working cells', () => {
    const schedule = {
      from: '2026-08-21',
      to: '2026-08-22',
      employees: [
        {
          employeeId: 1,
          employeeNumero: 'EMP001',
          employeeNombre: 'Ada Lovelace',
          companyId: 7,
          companyName: 'Victrium'
        }
      ],
      days: [
        { date: '2026-08-21', dayOfWeek: 5, label: 'Vie' },
        { date: '2026-08-22', dayOfWeek: 6, label: 'Sáb' }
      ],
      summary: {
        rangeDays: 2,
        plannedMinutes: 480,
        workedMinutes: 450,
        coverageRate: 93.75,
        plannedDays: 1,
        workedDays: 1,
        absenceDays: 0,
        incidentDays: 0,
        unplannedDays: 0,
        weeklyTargetMinutes: 480,
        monthlyTargetMinutes: null,
        targetMinutes: 480,
        targetLabel: 'weekly',
        remainingMinutes: 30,
        progressRate: 93.75
      },
      rows: [
        {
          employeeId: 1,
          employeeNumero: 'EMP001',
          employeeNombre: 'Ada Lovelace',
          companyId: 7,
          companyName: 'Victrium',
          days: [
            cell({ date: '2026-08-21', label: 'Vie', status: 'WORKING', statusLabel: 'Turno mañana' }),
            cell({
              date: '2026-08-22',
              label: 'Sáb',
              status: 'VACATION',
              statusLabel: 'Vacaciones',
              workingDay: false,
              isHoliday: false,
              shift: null,
              workLocationId: null,
              workLocationName: null,
              workLocationCode: null,
              workLocationSource: null,
              expectedStart: null,
              expectedEnd: null,
              expectedMinutes: 0,
              breakMinutes: 0,
              workedMinutes: 0,
              differenceMinutes: 0,
              lateMinutes: 0,
              employmentTermsId: null,
              employmentTermsContractType: null,
              employmentTermsWeeklyContractMinutes: null,
              employmentTermsAnnualContractMinutes: null,
              employmentTermsWorkingPercentage: null,
              vacationId: 42
            })
          ]
        }
      ]
    } satisfies Schedule;

    const visible = buildScheduleEvents(schedule, { showNonWorking: true });
    expect(visible).toHaveLength(2);
    expect(visible[0]).toMatchObject({
      kind: 'shift',
      title: 'Mañana',
      start: '2026-08-21T08:00:00',
      end: '2026-08-21T16:00:00'
    });
    expect(visible[1]).toMatchObject({
      kind: 'vacation',
      title: 'Vacaciones',
      start: '2026-08-22',
      end: '2026-08-23'
    });
  });

  it('builds vacation and permission events', () => {
    const vacations = [
      {
        id: 7,
        inicio: '2026-08-12',
        fin: '2026-08-16',
        consumidas: true,
        estado: 'APROBADO',
        aprobado: true,
        companyId: 7,
        companyName: 'Victrium',
        employeeId: 1,
        employeeNumero: 'EMP001',
        employeeNombre: 'Ada Lovelace'
      } satisfies Vacation
    ];
    const permissions = [
      {
        id: 8,
        dia: '2026-08-18',
        horaInicio: '09:00:00',
        horaFin: '11:00:00',
        descripcion: 'Gestión médica',
        estado: 'PENDIENTE',
        aprobado: false,
        companyId: 7,
        companyName: 'Victrium',
        employeeId: 1,
        employeeNumero: 'EMP001',
        employeeNombre: 'Ada Lovelace'
      } satisfies Permission
    ];

    expect(buildVacationEvents(vacations)[0]).toMatchObject({
      kind: 'vacation',
      title: 'Vacaciones aprobadas',
      start: '2026-08-12',
      end: '2026-08-17'
    });

    expect(buildPermissionEvents(permissions)[0]).toMatchObject({
      kind: 'permission',
      title: 'Gestión médica',
      start: '2026-08-18T09:00:00',
      end: '2026-08-18T11:00:00'
    });
  });

  it('builds calendar, time entry and planning period events', () => {
    const calendar = {
      id: 3,
      nombre: 'Calendario 2026',
      year: 2026,
      minutosMasEntrada: 10,
      minutosMenosEntrada: 10,
      active: true,
      days: [
        { id: 1, dia: '2026-01-06', horaInicio: '00:00:00', horaFin: '00:00:00' },
        { id: 2, dia: '2026-01-07', horaInicio: '09:00:00', horaFin: '17:00:00' }
      ] satisfies CalendarDay[]
    } satisfies Calendar;

    const entries = [
      {
        id: 12,
        hora: '08:01:00',
        dia: '2026-08-21',
        tipo: 'ENTRADA',
        origen: 'web',
        version: 1,
        updatedAt: null,
        usuarioId: 1,
        usuarioNumero: 'EMP001',
        usuarioNombre: 'Ada Lovelace',
        companyId: 7,
        companyName: 'Victrium'
      } satisfies TimeEntry
    ];

    const periods = [
      {
        id: 21,
        companyId: 7,
        companyName: 'Victrium',
        name: 'Agosto 2026',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        status: 'PUBLISHED',
        version: 1,
        publishedAt: '2026-08-01T00:00:00.000Z',
        publishedById: 1,
        publishedByNumero: 'EMP001',
        publishedByNombre: 'Ada Lovelace',
        notes: null,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z'
      } satisfies PlanningPeriod
    ];

    expect(buildCalendarEvents(calendar)).toHaveLength(2);
    expect(buildCalendarEvents(calendar)[0]).toMatchObject({
      kind: 'holiday',
      title: 'Festivo',
      start: '2026-01-06',
      end: '2026-01-07'
    });
    expect(buildTimeEntryEvents(entries)[0]).toMatchObject({
      kind: 'time-entry',
      title: 'Entrada',
      start: '2026-08-21T08:01:00'
    });
    expect(buildPlanningPeriodEvents(periods)[0]).toMatchObject({
      kind: 'planning-period',
      title: 'Agosto 2026',
      start: '2026-08-01',
      end: '2026-09-01'
    });
  });

  it('converts date ranges inclusively', () => {
    expect(toInclusiveRange(new Date(Date.UTC(2026, 7, 21)), new Date(Date.UTC(2026, 7, 22)))).toEqual({
      from: '2026-08-21',
      to: '2026-08-21'
    });
  });
});
