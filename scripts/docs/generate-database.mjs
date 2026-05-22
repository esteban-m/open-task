#!/usr/bin/env node
/**
 * Schéma BDD : ERD Mermaid depuis Prisma uniquement.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prismaSchemaToMermaid } from './lib/prisma-erd.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SCHEMA = path.join(REPO_ROOT, 'backend/prisma/schema.prisma');
const OUT = path.join(REPO_ROOT, 'docs/generated/database.md');

async function main() {
  const schema = await readFile(SCHEMA, 'utf8');
  const erd = prismaSchemaToMermaid(schema);

  const md = `# Modèle de données

## Schéma entité-relation (Prisma)

Source : \`backend/prisma/schema.prisma\`

\`\`\`mermaid
${erd}
\`\`\`

## Tables

| Modèle | Description |
|--------|-------------|
| User | Compte utilisateur |
| RefreshToken | Session refresh (hash SHA-256) |
| TaskList | Liste de tâches propriétaire |
| UserList | Partage et rôles (viewer/editor/admin) |
| ShareInvitation | Invitations par email |
| Task | Tâche liée à une liste |

> Le **flux d'authentification** (login, JWT, refresh) est documenté dans [Authentification](/generated/backend/authentication).  
> Le **flux temps réel** (WebSocket) est dans [Temps réel](/generated/explanation/realtime).
`;

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, md, 'utf8');
  console.log('[database] docs/generated/database.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
