import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_FILE_CHARS = 12_000;
const MAX_BUNDLE_CHARS = 55_000;

/**
 * Assemble les sources d'un chapitre pour le prompt IA.
 */
export async function bundleSources(repoRoot, sourcePaths) {
  const parts = [];
  let total = 0;

  for (const rel of sourcePaths) {
    const full = path.join(repoRoot, rel);
    let content;
    try {
      content = await readFile(full, 'utf8');
    } catch {
      parts.push(`### ${rel}\n\n_(fichier introuvable)_\n`);
      continue;
    }

    if (content.length > MAX_FILE_CHARS) {
      content = `${content.slice(0, MAX_FILE_CHARS)}\n\n/* … tronqué */`;
    }

    const block = `### Source: \`${rel}\`\n\n\`\`\`\n${content}\n\`\`\`\n`;
    if (total + block.length > MAX_BUNDLE_CHARS) {
      parts.push(`### ${rel}\n\n_(omis : limite de contexte)_\n`);
      continue;
    }
    parts.push(block);
    total += block.length;
  }

  return parts.join('\n');
}
