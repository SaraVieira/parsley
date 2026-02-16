import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getValueColor, isSimpleKey } from '@/lib/utils/shared';

const PATH_PREFIX_RE = /^\$\.?/;
const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;

type TableViewProps = {
  data: unknown;
};

type ArrayPath = {
  path: string;
  label: string;
  length: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pathLabel(path: string): string {
  return path === '$' ? 'root' : path.replace(PATH_PREFIX_RE, '');
}

function findNestedArraysInItem(
  obj: Record<string, unknown>,
  path: string,
  results: Array<ArrayPath>,
): void {
  const prefix = path === '$' ? '' : `${pathLabel(path)}.`;
  for (const [key, value] of Object.entries(obj)) {
    if (!Array.isArray(value)) {
      continue;
    }
    const hasObj = value.some((v) => isPlainObject(v));
    if (hasObj) {
      results.push({
        path: `${path}[*].${key}`,
        label: `${prefix}[*].${key}`,
        length: value.length,
      });
    }
  }
}

function findArrayPaths(
  data: unknown,
  path: string = '$',
  results: Array<ArrayPath> = [],
): Array<ArrayPath> {
  if (Array.isArray(data)) {
    const hasObjects = data.some((item) => isPlainObject(item));
    if (hasObjects) {
      results.push({ path, label: pathLabel(path), length: data.length });
    }
    if (data.length > 0 && isPlainObject(data[0])) {
      findNestedArraysInItem(data[0], path, results);
    }
  } else if (isPlainObject(data)) {
    for (const [key, value] of Object.entries(data)) {
      const childPath = isSimpleKey(key)
        ? `${path}.${key}`
        : `${path}["${key}"]`;
      findArrayPaths(value, childPath, results);
    }
  }
  return results;
}

function parseDotSegment(p: string): { key: string; rest: string } | null {
  const match = p.match(IDENTIFIER_RE);
  if (!match) {
    return null;
  }
  return { key: match[0], rest: p.slice(match[0].length) };
}

function parseBracketSegment(p: string): { key: string; rest: string } | null {
  const end = p.indexOf(']');
  if (end === -1) {
    return null;
  }
  let key = p.slice(1, end);
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return { key, rest: p.slice(end + 1) };
}

function parsePathSegments(path: string): Array<string> {
  const parts: Array<string> = [];
  let p = path.startsWith('$') ? path.slice(1) : path;
  while (p.length > 0) {
    if (p[0] === '.') {
      const result = parseDotSegment(p.slice(1));
      if (!result) {
        break;
      }
      parts.push(result.key);
      p = result.rest;
    } else if (p[0] === '[') {
      const result = parseBracketSegment(p);
      if (!result) {
        break;
      }
      parts.push(result.key);
      p = result.rest;
    } else {
      break;
    }
  }
  return parts;
}

function resolveArrayPart(current: Array<unknown>, part: string): unknown {
  const idx = Number(part);
  if (!Number.isNaN(idx)) {
    return current[idx];
  }
  return current.flatMap((item) => {
    if (isPlainObject(item)) {
      return item[part] ?? [];
    }
    return [];
  });
}

function getValueAtPath(data: unknown, path: string): unknown {
  if (path === '$') {
    return data;
  }

  const parts = parsePathSegments(path);
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (part === '*' && Array.isArray(current)) {
      continue;
    }
    if (Array.isArray(current)) {
      current = resolveArrayPart(current, part);
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function getColumns(data: Array<unknown>): Array<string> {
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

function getRowKey(
  row: unknown,
  index: number,
  columns: Array<string>,
): string {
  if (typeof row === 'object' && row !== null) {
    const obj = row as Record<string, unknown>;
    const id = obj.id ?? obj._id ?? obj.key;
    if (id !== undefined) {
      return String(id);
    }
    const first = columns[0];
    if (first && obj[first] !== undefined) {
      return `${String(obj[first])}-${index}`;
    }
  }
  return `row-${index}`;
}

function formatCell(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

type SortDir = 'asc' | 'desc';
type SortState = { column: string; dir: SortDir } | null;

function compareCells(a: unknown, b: unknown): number {
  if (a === b) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

export function TableView({ data }: TableViewProps) {
  const arrayPaths = useMemo(() => findArrayPaths(data), [data]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);

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

  const sortedRows = useMemo(() => {
    if (!sort) {
      return rows;
    }
    const { column, dir } = sort;
    return [...rows].sort((a, b) => {
      const va = (a as Record<string, unknown>)[column];
      const vb = (b as Record<string, unknown>)[column];
      const cmp = compareCells(va, vb);
      return dir === 'desc' ? -cmp : cmp;
    });
  }, [rows, sort]);

  const toggleSort = (col: string) => {
    setSort((prev) => {
      if (prev?.column !== col) {
        return { column: col, dir: 'asc' };
      }
      if (prev.dir === 'asc') {
        return { column: col, dir: 'desc' };
      }
      return null;
    });
  };

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
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {col}
                      {sort?.column === col ? (
                        sort.dir === 'asc' ? (
                          <ArrowUp className="size-3 text-primary" />
                        ) : (
                          <ArrowDown className="size-3 text-primary" />
                        )
                      ) : (
                        <ArrowUp className="size-3 opacity-0" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => (
                <tr
                  key={getRowKey(row, i, columns)}
                  className="border-b border-border/30 even:bg-muted/15 hover:bg-muted/30 transition-colors"
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
                          className={getValueColor(
                            value === null ? 'null' : typeof value,
                          )}
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
