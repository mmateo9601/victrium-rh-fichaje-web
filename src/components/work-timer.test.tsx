import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  start: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  finish: vi.fn()
}));

vi.mock('../lib/api/generated', () => ({
  api: {
    timeEntries: {
      current: mocks.current,
      start: mocks.start,
      pause: mocks.pause,
      resume: mocks.resume,
      finish: mocks.finish
    },
    shifts: {
      me: vi.fn().mockResolvedValue(null)
    }
  }
}));

import { WorkTimer } from './work-timer';

describe('WorkTimer', () => {
  beforeEach(() => {
    mocks.current.mockReset();
    mocks.start.mockReset();
    mocks.pause.mockReset();
    mocks.resume.mockReset();
    mocks.finish.mockReset();
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
      companyName: 'Victrium'
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
      companyName: 'Victrium'
    });

    render(<WorkTimer token="access-token" />);

    expect(await screen.findByRole('button', { name: /pausar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });
});
