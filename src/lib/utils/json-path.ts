import { isSimpleKey } from '@/lib/utils/shared';

const DIGITS_ONLY_RE = /^\d+$/;
const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;

/**
 * Set a value in a JSON object at the given path.
 * Path format: $.users[0].name or $["key with spaces"]
 * Returns a new object (immutable).
 */
export function setValueAtPath(
  root: unknown,
  path: string,
  value: unknown,
): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) {
    return value;
  }

  return setRecursive(root, segments, 0, value);
}

/**
 * Delete a key/index at the given path.
 * Returns a new object (immutable).
 */
export function deleteAtPath(root: unknown, path: string): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) {
    return undefined;
  }

  return deleteRecursive(root, segments, 0);
}

/**
 * Rename a key at the given path.
 * Path should point to the parent object + old key name.
 */
export function renameKeyAtPath(
  root: unknown,
  path: string,
  newKey: string,
): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) {
    return root;
  }

  const parentSegments = segments.slice(0, -1);
  const oldKey = segments[segments.length - 1];

  const parent = getValueAtPath(root, buildPath(parentSegments));
  if (parent === null || typeof parent !== 'object' || Array.isArray(parent)) {
    return root;
  }

  const obj = parent as Record<string, unknown>;
  const newObj: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (key === oldKey) {
      newObj[newKey] = obj[key];
    } else {
      newObj[key] = obj[key];
    }
  }

  if (parentSegments.length === 0) {
    return newObj;
  }
  return setValueAtPath(root, buildPath(parentSegments), newObj);
}

/**
 * Get a value at a given path.
 */
export function getValueAtPath(root: unknown, path: string): unknown {
  const segments = parsePath(path);
  let current = root;
  for (const seg of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const idx = Number(seg);
      current = current[idx];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Add a new key/value to an object or push to an array at the given path.
 * For objects: adds a new key with the given value.
 * For arrays: pushes the value (key is ignored).
 */
export function addAtPath(
  root: unknown,
  path: string,
  key: string,
  value: unknown,
): unknown {
  const target = getValueAtPath(root, path);

  if (Array.isArray(target)) {
    const newArr = [...target, value];
    if (path === '$') {
      return newArr;
    }
    return setValueAtPath(root, path, newArr);
  }

  if (typeof target === 'object' && target !== null) {
    const newObj = { ...(target as Record<string, unknown>), [key]: value };
    if (path === '$') {
      return newObj;
    }
    return setValueAtPath(root, path, newObj);
  }

  return root;
}

/**
 * Bulk rename all occurrences of a key name throughout the entire JSON structure.
 * Recursively traverses the tree and renames every matching key.
 */
export function bulkRenameKey(
  root: unknown,
  oldKey: string,
  newKey: string,
): unknown {
  if (oldKey === newKey) {
    return root;
  }
  return bulkRenameRecursive(root, oldKey, newKey);
}

function bulkRenameRecursive(
  current: unknown,
  oldKey: string,
  newKey: string,
): unknown {
  if (
    current === null ||
    current === undefined ||
    typeof current !== 'object'
  ) {
    return current;
  }

  if (Array.isArray(current)) {
    return current.map((item) => bulkRenameRecursive(item, oldKey, newKey));
  }

  const obj = current as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const renamedKey = key === oldKey ? newKey : key;
    result[renamedKey] = bulkRenameRecursive(obj[key], oldKey, newKey);
  }
  return result;
}

/**
 * Bulk delete all occurrences of a key name throughout the entire JSON structure.
 * Recursively traverses the tree and removes every matching key from objects.
 */
export function bulkDeleteKey(root: unknown, key: string): unknown {
  return bulkDeleteRecursive(root, key);
}

function bulkDeleteRecursive(current: unknown, key: string): unknown {
  if (
    current === null ||
    current === undefined ||
    typeof current !== 'object'
  ) {
    return current;
  }

  if (Array.isArray(current)) {
    return current.map((item) => bulkDeleteRecursive(item, key));
  }

  const obj = current as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (k === key) {
      continue;
    }
    result[k] = bulkDeleteRecursive(obj[k], key);
  }
  return result;
}

function buildPath(segments: Array<string>): string {
  let path = '$';
  for (const seg of segments) {
    if (DIGITS_ONLY_RE.test(seg)) {
      path += `[${seg}]`;
    } else if (isSimpleKey(seg)) {
      path += `.${seg}`;
    } else {
      path += `["${seg}"]`;
    }
  }
  return path;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: path parser with bracket/dot notation
function parsePath(path: string): Array<string> {
  // Remove leading $
  let p = path.startsWith('$') ? path.slice(1) : path;
  const segments: Array<string> = [];

  while (p.length > 0) {
    if (p[0] === '.') {
      p = p.slice(1);
      const match = p.match(IDENTIFIER_RE);
      if (match) {
        segments.push(match[0]);
        p = p.slice(match[0].length);
      }
    } else if (p[0] === '[') {
      const bracketEnd = p.indexOf(']');
      if (bracketEnd === -1) {
        break;
      }
      let key = p.slice(1, bracketEnd);
      // Remove quotes if present
      if (
        (key.startsWith('"') && key.endsWith('"')) ||
        (key.startsWith("'") && key.endsWith("'"))
      ) {
        key = key.slice(1, -1);
      }
      segments.push(key);
      p = p.slice(bracketEnd + 1);
    } else {
      break;
    }
  }

  return segments;
}

function setRecursive(
  current: unknown,
  segments: Array<string>,
  index: number,
  value: unknown,
): unknown {
  if (index === segments.length) {
    return value;
  }

  const seg = segments[index];

  if (Array.isArray(current)) {
    const idx = Number(seg);
    const newArr = [...current];
    newArr[idx] = setRecursive(current[idx], segments, index + 1, value);
    return newArr;
  }

  if (typeof current === 'object' && current !== null) {
    return {
      ...(current as Record<string, unknown>),
      [seg]: setRecursive(
        (current as Record<string, unknown>)[seg],
        segments,
        index + 1,
        value,
      ),
    };
  }

  return current;
}

function deleteRecursive(
  current: unknown,
  segments: Array<string>,
  index: number,
): unknown {
  if (index === segments.length - 1) {
    const seg = segments[index];
    if (Array.isArray(current)) {
      const idx = Number(seg);
      return current.filter((_, i) => i !== idx);
    }
    if (typeof current === 'object' && current !== null) {
      const { [seg]: _, ...rest } = current as Record<string, unknown>;
      return rest;
    }
    return current;
  }

  const seg = segments[index];

  if (Array.isArray(current)) {
    const idx = Number(seg);
    const newArr = [...current];
    newArr[idx] = deleteRecursive(current[idx], segments, index + 1);
    return newArr;
  }

  if (typeof current === 'object' && current !== null) {
    return {
      ...(current as Record<string, unknown>),
      [seg]: deleteRecursive(
        (current as Record<string, unknown>)[seg],
        segments,
        index + 1,
      ),
    };
  }

  return current;
}
