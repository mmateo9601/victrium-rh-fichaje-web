import { afterEach, describe, expect, it, vi } from 'vitest';

describe('env config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('normalizes the API base URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');

    const { env } = await import('./env');

    expect(env.apiBaseUrl).toBe('https://api.example.com');
  });

  it('throws when the API base URL is invalid', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'not-a-url');

    await expect(import('./env')).rejects.toThrow('Invalid NEXT_PUBLIC_API_URL in Web environment');
  });

  it('ignores localhost API URLs in production builds', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api/v1');

    const { env } = await import('./env');

    expect(env.apiBaseUrl).toBe('https://victrium-rh-fichaje-api.victriumtech.com');
  });
});
