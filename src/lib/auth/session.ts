import type { AuthSession } from '../api/generated';

const SESSION_KEY = 'victrium-rh-fichaje.session';

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
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
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
