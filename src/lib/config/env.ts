function validateApiBaseUrl(value: string | undefined) {
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_API_URL in Web environment');
  }

  try {
    return new URL(value).toString();
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_API_URL in Web environment');
  }
}

export const env = {
  apiBaseUrl: validateApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
} as const;
