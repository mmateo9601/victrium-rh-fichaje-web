import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  companyMine: vi.fn(),
  current: vi.fn(),
  meShift: vi.fn(),
  start: vi.fn(),
  pauseMine: vi.fn(),
  pause: vi.fn(),
  resumeMine: vi.fn(),
  resume: vi.fn(),
  finishMine: vi.fn(),
  finish: vi.fn()
}));

vi.mock('../lib/api/generated', () => ({
  api: {
    companies: {
      mine: mocks.companyMine
    },
    timeEntries: {
      current: mocks.current,
      start: mocks.start,
      pauseMine: mocks.pauseMine,
      pause: mocks.pause,
      resumeMine: mocks.resumeMine,
      resume: mocks.resume,
      finishMine: mocks.finishMine,
      finish: mocks.finish
    },
    shifts: {
      me: mocks.meShift
    }
  }
}));

import { WorkTimer } from './work-timer';

describe('WorkTimer', () => {
  beforeEach(() => {
    mocks.companyMine.mockReset();
    mocks.current.mockReset();
    mocks.meShift.mockReset();
    mocks.start.mockReset();
    mocks.pauseMine.mockReset();
    mocks.pause.mockReset();
    mocks.resumeMine.mockReset();
    mocks.resume.mockReset();
    mocks.finishMine.mockReset();
    mocks.finish.mockReset();

    mocks.companyMine.mockResolvedValue({
      id: 7,
      name: 'Victrium',
      code: 'VIC',
      timezone: 'Europe/Madrid',
      defaultCalendarId: null,
      workPolicy: { allowOvertime: true },
      active: true
    });
    mocks.meShift.mockResolvedValue(null);
  });

  it('shows the start action when there is no active session', async () => {
    mocks.current.mockResolvedValue({
      state: 'NOT_STARTED',
      sessionId: null,
      startedAt: null,
      finishedAt: null,
      activeBreak: null,
      workedSeconds: 0,
      breakSeconds: 0,
      usuarioId: 1,
      usuarioNumero: 'EMP001',
      usuarioNombre: 'Ada Lovelace',
      companyId: 7,
      companyName: 'Victrium',
      eligibility: {
        canStart: true,
        reason: 'ALLOWED',
        message: null,
        evaluatedAt: '2026-08-24T08:00:00+02:00',
        allowedFrom: null,
        allowedUntil: null,
        scheduledStart: null,
        scheduledEnd: null,
        earlyClockInMinutes: 10,
        companyId: 7,
        companyName: 'Victrium',
        workLocationId: null,
        workLocationName: null,
        workLocationCode: null,
        shiftId: null,
        shiftName: null,
        shiftCode: null
      }
    });

    render(<WorkTimer token="access-token" />);

    expect(await screen.findByRole('button', { name: /iniciar jornada/i })).toBeInTheDocument();
  });

  it('shows pause and finish actions when working', async () => {
    mocks.current.mockResolvedValue({
      state: 'WORKING',
      sessionId: 42,
      startedAt: '2026-08-21T08:00:00.000Z',
      finishedAt: null,
      activeBreak: null,
      workedSeconds: 1200,
      breakSeconds: 0,
      usuarioId: 1,
      usuarioNumero: 'EMP001',
      usuarioNombre: 'Ada Lovelace',
      companyId: 7,
      companyName: 'Victrium',
      eligibility: {
        canStart: false,
        reason: 'SESSION_ACTIVE',
        message: null,
        evaluatedAt: '2026-08-24T08:00:00+02:00',
        allowedFrom: null,
        allowedUntil: null,
        scheduledStart: null,
        scheduledEnd: null,
        earlyClockInMinutes: null,
        companyId: 7,
        companyName: 'Victrium',
        workLocationId: null,
        workLocationName: null,
        workLocationCode: null,
        shiftId: null,
        shiftName: null,
        shiftCode: null
      }
    });

    render(<WorkTimer token="access-token" />);

    expect(await screen.findByRole('button', { name: /pausar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });

  it('auto closes when overtime is not allowed and the shift has ended', async () => {
    mocks.current.mockResolvedValue({
      state: 'WORKING',
      sessionId: 42,
      startedAt: '2026-08-24T08:00:00.000Z',
      finishedAt: null,
      activeBreak: null,
      workedSeconds: 28800,
      breakSeconds: 0,
      usuarioId: 1,
      usuarioNumero: 'EMP001',
      usuarioNombre: 'Ada Lovelace',
      companyId: 7,
      companyName: 'Victrium',
      eligibility: {
        canStart: false,
        reason: 'SESSION_ACTIVE',
        message: null,
        evaluatedAt: '2026-08-24T18:10:00+02:00',
        allowedFrom: null,
        allowedUntil: '2026-08-24T11:00:00+02:00',
        scheduledStart: '2026-08-24T08:00:00+02:00',
        scheduledEnd: '2026-08-24T11:00:00+02:00',
        earlyClockInMinutes: null,
        companyId: 7,
        companyName: 'Victrium',
        workLocationId: null,
        workLocationName: null,
        workLocationCode: null,
        shiftId: null,
        shiftName: null,
        shiftCode: null
      }
    });
    mocks.companyMine.mockResolvedValue({
      id: 7,
      name: 'Victrium',
      code: 'VIC',
      timezone: 'Europe/Madrid',
      defaultCalendarId: null,
      workPolicy: { allowOvertime: false },
      active: true
    });
    mocks.meShift.mockResolvedValue({
      date: '2026-08-24',
      dayOfWeek: 1,
      label: 'Lunes',
      workingDay: true,
      isHoliday: false,
      status: 'WORKING',
      statusLabel: 'Trabajando',
      shift: null,
      workLocationId: null,
      workLocationName: null,
      workLocationCode: null,
      workLocationSource: null,
      assignmentId: null,
      overrideId: null,
      overrideKind: null,
      employmentTermsId: null,
      employmentTermsContractType: null,
      employmentTermsWeeklyContractMinutes: null,
      employmentTermsAnnualContractMinutes: null,
      employmentTermsWorkingPercentage: null,
      expectedStart: '08:00:00',
      expectedEnd: '11:00:00',
      expectedMinutes: 180,
      breakMinutes: 0,
      workedMinutes: 180,
      differenceMinutes: 0,
      lateMinutes: 0,
      vacationId: null,
      permissionId: null,
      incidentId: null,
      firstEntry: '08:00:00',
      lastExit: null,
      policy: null
    });
    mocks.finishMine.mockResolvedValue({
      state: 'COMPLETED',
      sessionId: 42,
      startedAt: '2026-08-24T08:00:00.000Z',
      finishedAt: '2026-08-24T17:05:00.000Z',
      activeBreak: null,
      workedSeconds: 32700,
      breakSeconds: 0,
      usuarioId: 1,
      usuarioNumero: 'EMP001',
      usuarioNombre: 'Ada Lovelace',
      companyId: 7,
      companyName: 'Victrium',
      eligibility: null
    });

    render(<WorkTimer token="access-token" />);

    await waitFor(() => {
      expect(mocks.finishMine).toHaveBeenCalled();
    });
  });
});
