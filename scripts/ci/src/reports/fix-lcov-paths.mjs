import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Préfixe chaque entrée SF: du LCOV pour éviter les collisions monorepo sur Codecov
 * (ex. `src/foo` partagé entre backend et scripts/docs).
 */
export function rewriteLcovPaths(content, prefix) {
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return content
    .split('\n')
    .map((line) => {
      if (!line.startsWith('SF:')) return line;
      const file = line.slice(3);
      if (file.startsWith(normalized) || file === normalized.slice(0, -1)) return line;
      return `SF:${normalized}${file}`;
    })
    .join('\n');
}

export function runFixLcovPaths(argv) {
  const file = argv[2];
  const prefix = argv[3];
  if (!file || !prefix) {
    throw new Error('Usage: node cli.mjs fix-lcov-paths <lcov.info> <prefix>');
  }
  const content = readFileSync(file, 'utf8');
  writeFileSync(file, rewriteLcovPaths(content, prefix));
}
