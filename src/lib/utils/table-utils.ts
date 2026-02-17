import { isSimpleKey } from '@/lib/utils/shared';

const PATH_PREFIX_RE = /^\$\.?/;
const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;

export type ArrayPath = {
  path: string;
  label: string;
  length: number;
};

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
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

export function findArrayPaths(
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

export function getValueAtPath(data: unknown, path: string): unknown {
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

export function getColumns(data: Array<unknown>): Array<string> {
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

export function getRowKey(
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

export function formatCell(value: unknown): string {
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

export function compareCells(a: unknown, b: unknown): number {
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
