import { createServerFn } from '@tanstack/react-start';
import pg from 'pg';

const CONNECTION_TIMEOUT_MS = 10000;

function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

export const listTables = createServerFn({ method: 'POST' })
  .inputValidator((d: { connectionString: string }) => d)
  .handler(async ({ data }) => {
    const client = new pg.Client({
      connectionString: data.connectionString,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });
    try {
      await client.connect();
      const result = await client.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
      );
      return result.rows.map(
        (r: Record<string, unknown>) => r.table_name as string,
      );
    } finally {
      await client.end();
    }
  });

export const fetchTableData = createServerFn({ method: 'POST' })
  .inputValidator((d: { connectionString: string; tables: Array<string> }) => d)
  .handler(async ({ data }) => {
    const client = new pg.Client({
      connectionString: data.connectionString,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });
    try {
      await client.connect();

      // Validate table names against actual tables to prevent SQL injection
      const validTables = await client.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
      );
      const validNames = new Set(
        validTables.rows.map(
          (r: Record<string, unknown>) => r.table_name as string,
        ),
      );

      const result: Record<
        string,
        Array<Record<string, string | number | boolean | null>>
      > = {};
      for (const table of data.tables) {
        if (!validNames.has(table)) {
          continue;
        }
        // Escape double quotes in table names to prevent query syntax errors
        const escaped = table.replace(/"/g, '""');
        const rows = await client.query(
          `SELECT * FROM "${escaped}" LIMIT 1000`,
        );
        // Round-trip through JSON to ensure serializable output; BigInt → Number
        result[table] = JSON.parse(JSON.stringify(rows.rows, jsonReplacer));
      }

      // Single table → array, multiple → object
      if (data.tables.length === 1 && result[data.tables[0]]) {
        return result[data.tables[0]];
      }
      return result;
    } finally {
      await client.end();
    }
  });
