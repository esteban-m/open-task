import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function bundleSources(repoRoot, sourcePaths, limits) {
  const maxFile = limits?.maxCharsPerFile ?? 12_000;
  const maxBundle = limits?.maxTotalChars ?? 55_000;
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

    if (content.length > maxFile) {
      content = `${content.slice(0, maxFile)}\n\n/* … tronqué */`;
    }

    const block = `### Source: \`${rel}\`\n\n\`\`\`\n${content}\n\`\`\`\n`;
    if (total + block.length > maxBundle) {
      parts.push(`### ${rel}\n\n_(omis : limite de contexte)_\n`);
      continue;
    }
    parts.push(block);
    total += block.length;
  }

  return parts.join('\n');
}
