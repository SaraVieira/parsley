export function mergeObjectShapes(objects: unknown[]): Record<string, unknown> {
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

export function getValueColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'number':
      return 'text-blue-500 dark:text-blue-400';
    case 'boolean':
      return 'text-amber-500 dark:text-amber-400';
    case 'null':
    case 'undefined':
      return 'text-muted-foreground italic';
    default:
      return 'text-foreground';
  }
}
