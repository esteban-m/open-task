import { writeFile } from 'node:fs/promises';

import { resolvePathUnder, sanitizeGeneratedMarkdown } from './sanitize.mjs';

export { sanitizeGeneratedMarkdown };

export async function writeGeneratedDoc(filePath, content, { baseDir } = {}) {
  const safePath = baseDir ? resolvePathUnder(baseDir, filePath) : filePath;
  await writeFile(safePath, sanitizeGeneratedMarkdown(content), 'utf8');
}
