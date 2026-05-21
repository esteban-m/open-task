#!/usr/bin/env node
/**
 * Référence API REST — extraction des routes NestJS (@Controller, @Get, etc.)
 */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(REPO_ROOT, 'backend/src');
const OUT = path.join(REPO_ROOT, 'docs/generated/api-reference.md');

async function walk(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith('.controller.ts')) files.push(p);
  }
  return files;
}

function parseController(content, file) {
  const ctrl = content.match(/@Controller\(['"`]([^'"`]*)['"`]\)/);
  const prefix = ctrl?.[1] ?? '';
  const routes = [];
  const re =
    /@(Get|Post|Put|Patch|Delete)\(['"`]?([^'"`)\s]*)?['"`]?\)\s*\n\s*(?:@\w+\([^)]*\)\s*\n\s*)*async\s+(\w+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const sub = m[2] ?? '';
    const handler = m[3];
    const fullPath = `/${[prefix, sub].filter(Boolean).join('/').replace(/\/+/g, '/')}`;
    routes.push({ method, path: fullPath || '/', handler });
  }
  return { file: path.relative(REPO_ROOT, file), prefix, routes };
}

async function main() {
  const controllers = await walk(SRC);
  const sections = ['# Référence API REST\n', '> Extrait des contrôleurs NestJS. Swagger live : `/api` en local.\n'];

  for (const file of controllers.sort()) {
    const content = await readFile(file, 'utf8');
    const parsed = parseController(content, file);
    if (!parsed.routes.length) continue;
    sections.push(`\n## \`${parsed.file}\`\n`);
    sections.push('| Méthode | Chemin | Handler |');
    sections.push('|---------|--------|---------|');
    for (const r of parsed.routes) {
      sections.push(`| ${r.method} | \`${r.path}\` | \`${r.handler}\` |`);
    }
  }

  sections.push(`
## WebSocket (TasksGateway)

| Événement | Description |
|-----------|-------------|
| \`task:created\` | Nouvelle tâche dans la room \`list:{id}\` |
| \`task:updated\` | Mise à jour tâche |
| \`task:deleted\` | Suppression |
| \`task:completed\` | Toggle terminé |
`);

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, sections.join('\n'), 'utf8');
  console.log('[api] docs/generated/api-reference.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
