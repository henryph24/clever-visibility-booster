export interface CSVColumn {
  key: string;
  header: string;
}

export function generateCSV(data: Record<string, unknown>[], columns: CSVColumn[]): string {
  const header = columns.map((c) => `"${c.header}"`).join(',');

  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return String(value);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}
