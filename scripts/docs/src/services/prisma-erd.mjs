const SCALAR_TYPES = new Set([
  'String',
  'Int',
  'Boolean',
  'DateTime',
  'Float',
  'Decimal',
  'BigInt',
  'Bytes',
  'Json',
]);

export function prismaSchemaToMermaid(schemaText) {
  const models = [];
  let current = null;
  let inBlock = false;

  for (const rawLine of schemaText.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;

    if (line.startsWith('model ')) {
      current = { name: line.split(/\s+/)[1], scalars: [], relations: [] };
      models.push(current);
      inBlock = true;
      continue;
    }

    if (line === '}') {
      current = null;
      inBlock = false;
      continue;
    }

    if (!inBlock || !current) continue;

    if (line.includes('@relation')) {
      const relMatch = line.match(/^(\w+)\s+(\w+)/);
      if (relMatch) {
        current.relations.push({
          field: relMatch[1],
          target: relMatch[2].replace('[]', ''),
        });
      }
      continue;
    }

    const fieldMatch = line.match(/^(\w+)\s+(\w+)(\[\])?/);
    if (!fieldMatch) continue;

    const [, fieldName, fieldType, isList] = fieldMatch;
    const baseType = fieldType.replace('[]', '');

    if (!SCALAR_TYPES.has(baseType)) {
      current.relations.push({ field: fieldName, target: baseType });
      continue;
    }

    current.scalars.push({
      name: fieldName,
      type: mapPrismaType(baseType) + (isList ? '[]' : ''),
      pk: line.includes('@id'),
    });
  }

  const lines = ['erDiagram'];
  const relations = new Set();

  for (const model of models) {
    lines.push(`  ${sanitizeId(model.name)} {`);
    for (const field of model.scalars) {
      lines.push(`    ${field.type} ${field.name}${field.pk ? ' PK' : ''}`);
    }
    lines.push('  }');
  }

  for (const model of models) {
    for (const rel of model.relations) {
      const left = sanitizeId(model.name);
      const right = sanitizeId(rel.target);
      const key = [left, right].sort().join('--');
      if (relations.has(key)) continue;
      relations.add(key);
      lines.push(`  ${left} ||--o{ ${right} : "${rel.field}"`);
    }
  }

  return lines.join('\n');
}

function sanitizeId(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function mapPrismaType(t) {
  const map = {
    String: 'string',
    Int: 'int',
    Boolean: 'boolean',
    DateTime: 'datetime',
    Float: 'float',
    Json: 'json',
    BigInt: 'int',
    Decimal: 'float',
    Bytes: 'string',
  };
  return map[t] ?? 'string';
}
