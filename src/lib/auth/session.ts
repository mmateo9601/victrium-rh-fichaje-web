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

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

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
