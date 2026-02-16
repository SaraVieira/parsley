function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getColumns(rows: Array<Record<string, unknown>>): Array<string> {
  const cols = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      cols.add(key);
    }
  }
  return Array.from(cols);
}

export function jsonToCsv(data: unknown): string | null {
  let rows: Array<Record<string, unknown>>;

  if (Array.isArray(data)) {
    // Array of primitives → single "value" column
    if (data.length === 0) return null;
    if (data.every((item) => typeof item !== 'object' || item === null)) {
      return `value\n${data.map((v) => escapeCsvField(v)).join('\n')}`;
    }
    rows = data.filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && !Array.isArray(item),
    );
  } else if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data)
  ) {
    // Single object → key/value rows
    const entries = Object.entries(data as Record<string, unknown>);
    return `key,value\n${entries.map(([k, v]) => `${escapeCsvField(k)},${escapeCsvField(v)}`).join('\n')}`;
  } else {
    return null;
  }

  if (rows.length === 0) return null;

  const columns = getColumns(rows);
  const header = columns.map(escapeCsvField).join(',');
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvField(row[col])).join(','),
  );

  return `${header}\n${lines.join('\n')}`;
}
