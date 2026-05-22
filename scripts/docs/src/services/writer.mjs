import { writeFile } from 'node:fs/promises';

import { resolvePathUnder, sanitizeGeneratedMarkdown } from './sanitize.mjs';

export async function writeGeneratedDoc(filePath, content, { baseDir } = {}) {
  const safePath = baseDir ? resolvePathUnder(baseDir, filePath) : filePath;
  const safeContent = sanitizeGeneratedMarkdown(content);
  // codeql[js/http-to-file-access]: sanitized LLM output written only under generatedDir
  await writeFile(safePath, safeContent, 'utf8');
}
