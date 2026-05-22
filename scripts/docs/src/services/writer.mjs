import { writeFile } from 'node:fs/promises';

export function sanitizeGeneratedMarkdown(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 200_000);
}

export async function writeGeneratedDoc(filePath, content) {
  await writeFile(filePath, sanitizeGeneratedMarkdown(content), 'utf8');
}
