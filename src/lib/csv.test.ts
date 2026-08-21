import { describe, expect, it, vi } from 'vitest';

import { buildCsv, collectAllPages, escapeCsvCell } from './csv';

describe('csv helpers', () => {
  it('escapes quotes and wraps every cell', () => {
    expect(escapeCsvCell('A "B", C')).toBe('"A ""B"", C"');
    expect(
      buildCsv(
        ['Nombre', 'Nota'],
        [['Ana, Admin', 'Línea 1\nLínea 2']]
      )
    ).toBe('"Nombre","Nota"\n"Ana, Admin","Línea 1\nLínea 2"');
  });

  it('collects every page until the last one', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 1 }],
        pagination: { page: 1, pageSize: 2, total: 3, totalPages: 2 }
      })
      .mockResolvedValueOnce({
        data: [{ id: 2 }, { id: 3 }],
        pagination: { page: 2, pageSize: 2, total: 3, totalPages: 2 }
      });

    await expect(collectAllPages(fetchPage, { search: 'ana' }, 2)).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, { search: 'ana', page: 1, pageSize: 2 });
    expect(fetchPage).toHaveBeenNthCalledWith(2, { search: 'ana', page: 2, pageSize: 2 });
  });
});
