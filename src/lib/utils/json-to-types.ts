import { capitalize, isSimpleKey, mergeObjectShapes } from '@/lib/utils/shared';

function inferType(value: unknown, name: string, indent: number): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }

  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      break;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'unknown[]';
    }

    // Check if all items have the same shape
    const first = value[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      // Merge all object shapes
      const merged = mergeObjectShapes(
        value.filter((v) => typeof v === 'object' && v !== null),
      );
      return `${generateInterface(merged, `${name}Item`, indent)}[]`;
    }

    const itemType = inferType(first, `${name}Item`, indent);
    return `${itemType}[]`;
  }

  if (typeof value === 'object') {
    return generateInterface(value as Record<string, unknown>, name, indent);
  }

  return 'unknown';
}

function generateInterface(
  obj: Record<string, unknown>,
  name: string,
  indent: number,
): string {
  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);
  const lines: Array<string> = [];

  lines.push(`{\n`);

  for (const [key, value] of Object.entries(obj)) {
    const safeKey = isSimpleKey(key) ? key : `"${key}"`;
    const typeName = capitalize(name) + capitalize(key);
    const type = inferType(value, typeName, indent + 1);
    lines.push(`${innerPad}${safeKey}: ${type};\n`);
  }

  lines.push(`${pad}}`);
  return lines.join('');
}

export function jsonToTypeScript(data: unknown, rootName = 'Root'): string {
  if (data === null || data === undefined) {
    return `type ${rootName} = ${String(data)};`;
  }

  if (typeof data !== 'object') {
    return `type ${rootName} = ${typeof data};`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `type ${rootName} = unknown[];`;
    }
    const first = data[0];
    if (typeof first === 'object' && first !== null) {
      const merged = mergeObjectShapes(
        data.filter((v) => typeof v === 'object' && v !== null),
      );
      const iface = generateInterface(merged, `${rootName}Item`, 0);
      return `type ${rootName}Item = ${iface}\n\ntype ${rootName} = ${rootName}Item[];`;
    }
    return `type ${rootName} = ${inferType(first, rootName, 0)}[];`;
  }

  const iface = generateInterface(data as Record<string, unknown>, rootName, 0);
  return `type ${rootName} = ${iface}`;
}
