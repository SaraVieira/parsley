import { capitalize, isSimpleKey, mergeObjectShapes } from '@/lib/utils/shared';

function inferZod(value: unknown, name: string, indent: number): string {
  if (value === null) {
    return 'z.null()';
  }
  if (value === undefined) {
    return 'z.undefined()';
  }

  switch (typeof value) {
    case 'string':
      return 'z.string()';
    case 'number':
      return Number.isInteger(value) ? 'z.number().int()' : 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    default:
      break;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'z.array(z.unknown())';
    }

    const first = value[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const merged = mergeObjectShapes(
        value.filter((v) => typeof v === 'object' && v !== null),
      );
      return `z.array(${generateZodObject(merged, `${name}Item`, indent)})`;
    }

    const itemSchema = inferZod(first, `${name}Item`, indent);
    return `z.array(${itemSchema})`;
  }

  if (typeof value === 'object') {
    return generateZodObject(value as Record<string, unknown>, name, indent);
  }

  return 'z.unknown()';
}

function generateZodObject(
  obj: Record<string, unknown>,
  name: string,
  indent: number,
): string {
  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);
  const lines: Array<string> = [];

  lines.push(`z.object({\n`);

  const entries = Object.entries(obj);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const safeKey = isSimpleKey(key) ? key : `"${key}"`;
    const typeName = capitalize(name) + capitalize(key);
    const schema = inferZod(value, typeName, indent + 1);
    const comma = ',';
    lines.push(`${innerPad}${safeKey}: ${schema}${comma}\n`);
  }

  lines.push(`${pad}})`);
  return lines.join('');
}

export function jsonToZod(data: unknown, rootName = 'root'): string {
  const schemaName = `${rootName.charAt(0).toLowerCase() + rootName.slice(1)}Schema`;

  if (data === null || data === undefined) {
    return `import { z } from "zod";\n\nconst ${schemaName} = ${data === null ? 'z.null()' : 'z.undefined()'};`;
  }

  if (typeof data !== 'object') {
    const schema = inferZod(data, rootName, 0);
    return `import { z } from "zod";\n\nconst ${schemaName} = ${schema};`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `import { z } from "zod";\n\nconst ${schemaName} = z.array(z.unknown());`;
    }
    const first = data[0];
    if (typeof first === 'object' && first !== null) {
      const merged = mergeObjectShapes(
        data.filter((v) => typeof v === 'object' && v !== null),
      );
      const itemSchema = generateZodObject(merged, `${rootName}Item`, 0);
      return `import { z } from "zod";\n\nconst ${rootName}ItemSchema = ${itemSchema};\n\nconst ${schemaName} = z.array(${rootName}ItemSchema);`;
    }
    const itemSchema = inferZod(first, rootName, 0);
    return `import { z } from "zod";\n\nconst ${schemaName} = z.array(${itemSchema});`;
  }

  const schema = generateZodObject(
    data as Record<string, unknown>,
    rootName,
    0,
  );
  return `import { z } from "zod";\n\nconst ${schemaName} = ${schema};`;
}
