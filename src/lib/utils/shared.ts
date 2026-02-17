export function mergeObjectShapes(
  objects: Array<unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const obj of objects) {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (!(key in merged)) {
          merged[key] = value;
        }
      }
    }
  }
  return merged;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SIMPLE_KEY_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

export function isSimpleKey(key: string): boolean {
  return SIMPLE_KEY_RE.test(key);
}

export function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function getValueDisplay(value: unknown): {
  display: string;
  type: string;
} {
  if (value === null) {
    return { display: 'null', type: 'null' };
  }
  if (value === undefined) {
    return { display: 'undefined', type: 'undefined' };
  }
  if (typeof value === 'string') {
    return { display: `"${value}"`, type: 'string' };
  }
  if (typeof value === 'number') {
    return { display: String(value), type: 'number' };
  }
  if (typeof value === 'boolean') {
    return { display: String(value), type: 'boolean' };
  }
  if (Array.isArray(value)) {
    return { display: `Array(${value.length})`, type: 'array' };
  }
  return { display: 'Object', type: 'object' };
}

export function getValueColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-emerald-400';
    case 'number':
      return 'text-blue-400';
    case 'boolean':
      return 'text-amber-400';
    case 'null':
    case 'undefined':
      return 'text-muted-foreground italic';
    default:
      return 'text-foreground';
  }
}
