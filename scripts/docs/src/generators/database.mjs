import { mkdir, readFile } from 'node:fs/promises';

import { prismaSchemaToMermaid } from '../services/prisma-erd.mjs';
import { writeGeneratedDoc } from '../services/writer.mjs';

export async function generateDatabase(config, paths) {
  const schema = await readFile(paths.prismaSchema, 'utf8');
  const erd = prismaSchemaToMermaid(schema);
  const { database: db } = config;

  const tableRows = db.tables.map((t) => `| ${t.model} | ${t.description} |`).join('\n');
  const crossLinkLines = (db.crossLinks ?? [])
    .map((l) => `> Le **${l.label}** est documenté dans [${l.title ?? l.label}](${l.href}).`)
    .join('\n');

  const md = `# ${db.title}

## Schéma entité-relation (Prisma)

Source : \`${config.paths.prismaSchema}\`

\`\`\`mermaid
${erd}
\`\`\`

## Tables

| Modèle | Description |
|--------|-------------|
${tableRows}

${crossLinkLines}
`;

  const out = paths.generatedFile('database.md');
  await mkdir(paths.generatedDir, { recursive: true });
  await writeGeneratedDoc(out, md);
  console.log('[database] docs/generated/database.md');
}
