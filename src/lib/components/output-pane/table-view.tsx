import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TableViewProps = {
  data: unknown;
};

type ArrayPath = {
  path: string;
  label: string;
  length: number;
};

function findArrayPaths(
  data: unknown,
  path: string = '$',
  results: ArrayPath[] = [],
): ArrayPath[] {
  if (Array.isArray(data)) {
    const hasObjects = data.some(
      (item) =>
        typeof item === 'object' && item !== null && !Array.isArray(item),
    );
    if (hasObjects) {
      const label = path === '$' ? 'root' : path.replace(/^\$\.?/, '');
      results.push({ path, label, length: data.length });
    }
    // Also look inside array items for nested arrays
    for (let i = 0; i < Math.min(data.length, 1); i++) {
      if (
        typeof data[i] === 'object' &&
        data[i] !== null &&
        !Array.isArray(data[i])
      ) {
        const obj = data[i] as Record<string, unknown>;
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            const childPath = `${path}[*].${key}`;
            const hasObj = value.some(
              (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
            );
            if (hasObj) {
              results.push({
                path: childPath,
                label: `${path === '$' ? '' : path.replace(/^\$\.?/, '') + '.'}[*].${key}`,
                length: value.length,
              });
            }
          }
        }
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      const childPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? `${path}.${key}`
        : `${path}["${key}"]`;
      findArrayPaths(value, childPath, results);
    }
  }
  return results;
}

function getValueAtPath(data: unknown, path: string): unknown {
  if (path === '$') return data;

  const parts: string[] = [];
  let p = path.startsWith('$') ? path.slice(1) : path;
  while (p.length > 0) {
    if (p[0] === '.') {
      p = p.slice(1);
      const match = p.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (match) {
        parts.push(match[0]);
        p = p.slice(match[0].length);
      }
    } else if (p[0] === '[') {
      const end = p.indexOf(']');
      if (end === -1) break;
      let key = p.slice(1, end);
      if (
        (key.startsWith('"') && key.endsWith('"')) ||
        (key.startsWith("'") && key.endsWith("'"))
      ) {
        key = key.slice(1, -1);
      }
      if (key === '*') {
        parts.push('*');
      } else {
        parts.push(key);
      }
      p = p.slice(end + 1);
    } else {
      break;
    }
  }

  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (part === '*') {
      // Flatten: collect from all array items
      if (Array.isArray(current)) {
        continue; // skip, next part will collect from items
      }
    }
    if (Array.isArray(current)) {
      const idx = Number(part);
      if (!isNaN(idx)) {
        current = current[idx];
      } else {
        // Collect property from all array items
        current = current.flatMap((item) => {
          if (typeof item === 'object' && item !== null) {
            return (item as Record<string, unknown>)[part] ?? [];
          }
          return [];
        });
      }
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function getColumns(data: unknown[]): string[] {
  const cols = new Set<string>();
  for (const item of data) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      for (const key of Object.keys(item)) {
        cols.add(key);
      }
    }
  }
  return Array.from(cols);
}

function formatCell(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function TableView({ data }: TableViewProps) {
  const arrayPaths = useMemo(() => findArrayPaths(data), [data]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const activePath =
    selectedPath ?? (arrayPaths.length > 0 ? arrayPaths[0].path : null);
  const activeData = activePath ? getValueAtPath(data, activePath) : data;

  const { rows, columns, isTableData } = useMemo(() => {
    const d = activeData;
    if (!Array.isArray(d)) {
      if (typeof d === 'object' && d !== null) {
        const entries = Object.entries(d);
        return {
          rows: entries.map(([k, v]) => ({ key: k, value: v })),
          columns: ['key', 'value'],
          isTableData: true,
        };
      }
      return { rows: [], columns: [], isTableData: false };
    }

    if (d.length === 0) {
      return { rows: [], columns: [], isTableData: true };
    }

    if (d.every((item) => typeof item !== 'object' || item === null)) {
      return {
        rows: d.map((item, i) => ({ index: i, value: item })),
        columns: ['index', 'value'],
        isTableData: true,
      };
    }

    const columns = getColumns(d);
    return { rows: d, columns, isTableData: true };
  }, [activeData]);

  if (!isTableData && arrayPaths.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Table view works best with arrays of objects. Use Text view for this
        data.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {arrayPaths.length > 1 && (
        <div className="flex items-center gap-2 border-b px-2 py-1">
          <span className="text-[10px] text-muted-foreground">Source:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" className="h-6 text-xs">
                {arrayPaths.find((p) => p.path === activePath)?.label ?? 'root'}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {arrayPaths.map((ap) => (
                <DropdownMenuItem
                  key={ap.path}
                  onClick={() => setSelectedPath(ap.path)}
                  className={ap.path === activePath ? 'bg-accent' : ''}
                >
                  <span className="font-mono text-xs">{ap.label}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    ({ap.length} items)
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Empty data - nothing to display.
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap border-r border-border/40 px-3 py-2 text-left font-semibold text-foreground last:border-r-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => {
                    const value = (row as Record<string, unknown>)[col];
                    const display = formatCell(value);
                    return (
                      <td
                        key={col}
                        className="whitespace-nowrap border-r border-border/20 px-3 py-1.5 text-foreground last:border-r-0"
                      >
                        <span
                          className={
                            value === null
                              ? 'italic text-muted-foreground'
                              : typeof value === 'number'
                                ? 'text-blue-500 dark:text-blue-400'
                                : typeof value === 'boolean'
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : typeof value === 'string'
                                    ? 'text-emerald-500 dark:text-emerald-400'
                                    : ''
                          }
                        >
                          {display}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
            {rows.length} row{rows.length !== 1 ? 's' : ''} × {columns.length}{' '}
            column{columns.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
