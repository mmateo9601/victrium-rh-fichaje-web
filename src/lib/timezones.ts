const fallbackTimezones = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Lisbon',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Athens',
  'Europe/Helsinki',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Sao_Paulo',
  'Africa/Casablanca',
  'Africa/Algiers',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland'
];

let cachedTimezones: string[] | null = null;

export function getTimezoneOptions() {
  if (cachedTimezones) {
    return cachedTimezones;
  }

  try {
    const values = Intl.supportedValuesOf('timeZone');
    if (values.length) {
      cachedTimezones = [...values].sort((left, right) => left.localeCompare(right));
      return cachedTimezones;
    }
  } catch {
    // Fallback below.
  }

  cachedTimezones = fallbackTimezones;
  return cachedTimezones;
}
