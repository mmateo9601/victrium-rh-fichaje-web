import type { PaginatedResult } from './api/generated';

export type CsvCell = string | number | boolean | null | undefined;

export function escapeCsvCell(value: CsvCell) {
  const normalized = value === null || value === undefined ? '' : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function buildCsv(headers: string[], rows: CsvCell[][]) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...bodyLines].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  globalThis.document.body.appendChild(link);
  link.click();
  globalThis.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function collectAllPages<T, Q extends { page?: number; pageSize?: number }>(
  fetchPage: (query: Q) => Promise<PaginatedResult<T>>,
  query: Omit<Q, 'page' | 'pageSize'> = {} as Omit<Q, 'page' | 'pageSize'>,
  pageSize = 100
) {
  const firstResult = await fetchPage({ ...(query as Q), page: 1, pageSize });
  const items = [...firstResult.data];

  for (let page = 2; page <= firstResult.pagination.totalPages; page += 1) {
    const result = await fetchPage({ ...(query as Q), page, pageSize });
    items.push(...result.data);
  }

  return items;
}
