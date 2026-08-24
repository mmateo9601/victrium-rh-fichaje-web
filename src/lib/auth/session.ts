'use client';

import { useEffect, useState } from 'react';

import type { AuthSession } from '../api/generated';

const SESSION_KEY = 'victrium-rh-fichaje.session';
const SESSION_EVENT = 'victrium-rh-fichaje.session-changed';

function notifySessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(SESSION_EVENT));
}

function normalizeSession(session: AuthSession | null): AuthSession | null {
  if (!session) {
    return null;
  }

  const roles = Array.isArray(session.user.roles) ? session.user.roles : [];
  const normalizedRoles =
    session.user.admin && !roles.includes('ROLE_SUPER_ADMIN') ? [...roles, 'ROLE_SUPER_ADMIN'] : roles;

  if (normalizedRoles === roles) {
    return session;
  }

  return {
    ...session,
    user: {
      ...session.user,
      roles: normalizedRoles as AuthSession['user']['roles']
    }
  };
}

export function getEffectiveRoles(session: AuthSession | null) {
  if (!session) {
    return [] as AuthSession['user']['roles'];
  }

  const roles = Array.isArray(session.user.roles) ? session.user.roles : [];
  const hasSuperAdminRole = roles.includes('ROLE_SUPER_ADMIN');
  if (session.user.admin && !hasSuperAdminRole) {
    return [...roles, 'ROLE_SUPER_ADMIN'] as AuthSession['user']['roles'];
  }

  return roles as AuthSession['user']['roles'];
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(raw) as AuthSession);
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalizeSession(session)));
  notifySessionChange();
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
}

export function getAccessToken() {
  return getStoredSession()?.accessToken ?? null;
}

export async function signOut() {
  const session = getStoredSession();
  try {
    if (session?.refreshToken) {
      const { api } = await import('../api/generated');
      await api.auth.logout({ refreshToken: session.refreshToken });
    }
  } catch {
    // Best effort: local session still gets cleared even if the network call fails.
  } finally {
    clearSession();
  }
}

export function useStoredSession() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const syncSession = () => setSession(getStoredSession());

    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) {
        syncSession();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(SESSION_EVENT, syncSession);
    syncSession();

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SESSION_EVENT, syncSession);
    };
  }, []);

  return session;
}
