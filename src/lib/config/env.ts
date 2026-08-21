const productionApiBaseUrl = 'https://victrium-rh-fichaje-api.victriumtech.com/api/v1';

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0';
  } catch {
    return false;
  }
}

function validateApiBaseUrl(value: string | undefined) {
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_API_URL in Web environment');
  }

  try {
    const normalized = new URL(value).toString();
    if (process.env.NODE_ENV === 'production' && isLocalhostUrl(normalized)) {
      return productionApiBaseUrl;
    }
    return normalized;
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_API_URL in Web environment');
  }
}

export const env = {
  apiBaseUrl: validateApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
} as const;
