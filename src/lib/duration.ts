function normalizeNumericString(value: string) {
  return value.trim().replace(',', '.');
}

export function parseFlexibleDurationMinutes(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const colonMatch = trimmed.match(/^(\d+)\s*:\s*([0-5]?\d)$/);
  if (colonMatch) {
    return Number(colonMatch[1]) * 60 + Number(colonMatch[2]);
  }

  const hourSuffixMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*h(?:\s*(\d{1,2}))?$/i);
  if (hourSuffixMatch) {
    const hours = Number(normalizeNumericString(hourSuffixMatch[1]));
    const extraMinutes = hourSuffixMatch[2] ? Number(hourSuffixMatch[2]) : 0;
    return Math.max(0, Math.round(hours * 60 + extraMinutes));
  }

  if (/^\d+(?:[.,]\d+)?$/.test(trimmed)) {
    const numericValue = Number(normalizeNumericString(trimmed));
    if (Number.isFinite(numericValue)) {
      if (trimmed.includes('.') || trimmed.includes(',')) {
        return Math.max(0, Math.round(numericValue * 60));
      }

      return Math.max(0, Math.round(numericValue));
    }
  }

  return null;
}

export function formatFlexibleDurationMinutes(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '';
  }

  const safeMinutes = Math.max(0, Math.round(value));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (minutes === 0) {
    return hours > 0 ? `${hours}:00` : `${safeMinutes}`;
  }

  if (hours === 0) {
    return `${minutes}`;
  }

  return `${hours}:${String(minutes).padStart(2, '0')}`;
}
