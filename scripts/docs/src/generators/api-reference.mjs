import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Parse ligne par ligne — évite ReDoS (CodeQL) sur regex globale. */
export function parseController(content, file, repoRoot) {
  const ctrl = content.match(/@Controller\(['"`]([^'"`]*)['"`]\)/);
  const prefix = ctrl?.[1] ?? '';
  const routes = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const routeMatch = line.match(
      /@(Get|Post|Put|Patch|Delete)\(\s*['"`]?([^'"`)\s]*)?['"`]?\s*\)/,
    );
    if (!routeMatch) continue;

    let handler = null;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j += 1) {
      const asyncMatch = lines[j].match(/\basync\s+(\w+)\s*\(/);
      if (asyncMatch) {
        handler = asyncMatch[1];
        break;
      }
    }
    if (!handler) continue;

    const method = routeMatch[1].toUpperCase();
    const sub = routeMatch[2] ?? '';
    const fullPath = `/${[prefix, sub].filter(Boolean).join('/').replace(/\/+/g, '/')}`;
    routes.push({ method, path: fullPath || '/', handler });
  }

  return { file: path.relative(repoRoot, file), routes };
}

async function walkControllers(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walkControllers(p)));
    else if (e.name.endsWith('.controller.ts')) files.push(p);
  }
  return files;
}

export async function generateApiReference(config, paths) {
  const controllers = await walkControllers(paths.backendSrc);
  const sections = [
    '# Référence API REST\n',
    '> Extrait des contrôleurs NestJS. Swagger live : `/api` en local.\n',
  ];

  for (const file of controllers.sort()) {
    const content = await readFile(file, 'utf8');
    const parsed = parseController(content, file, paths.repoRoot);
    if (!parsed.routes.length) continue;
    sections.push(`\n## \`${parsed.file}\`\n`);
    sections.push('| Méthode | Chemin | Handler |');
    sections.push('|---------|--------|---------|');
    for (const r of parsed.routes) {
      sections.push(`| ${r.method} | \`${r.path}\` | \`${r.handler}\` |`);
    }
  }

  sections.push('\n## WebSocket (TasksGateway)\n');
  sections.push('| Événement | Description |');
  sections.push('|-----------|-------------|');
  for (const ev of config.apiReference.websocketEvents) {
    sections.push(`| \`${ev.event}\` | ${ev.description} |`);
  }

  const out = paths.generatedFile('api-reference.md');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, sections.join('\n'), 'utf8');
  console.log('[api] docs/generated/api-reference.md');
}
