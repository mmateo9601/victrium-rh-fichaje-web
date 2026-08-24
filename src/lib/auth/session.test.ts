import { beforeEach, describe, expect, it } from 'vitest';

import { clearSession, getAccessToken, getStoredSession, saveSession } from './session';

const session = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  user: {
    id: 1,
    numero: 'ADM001',
    nombreEmpleado: 'Ada Admin',
    companyId: 1,
    employeeId: 1,
    roles: ['ROLE_COMPANY_ADMIN'],
    admin: true
  }
} as any;

describe('session storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reads the stored session', () => {
    saveSession(session);

    expect(getStoredSession()).toEqual({
      ...session,
      user: {
        ...session.user,
        roles: ['ROLE_COMPANY_ADMIN', 'ROLE_SUPER_ADMIN']
      }
    });
    expect(getAccessToken()).toBe('access-token');
  });

  it('clears the stored session', () => {
    saveSession(session);
    clearSession();

    expect(getStoredSession()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
