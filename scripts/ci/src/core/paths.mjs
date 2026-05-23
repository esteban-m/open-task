import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Racine du paquet `scripts/ci` (depuis `src/core/` ou `cli.mjs`). */
export function packageRoot(fromMetaUrl = import.meta.url) {
  const dir = path.dirname(fileURLToPath(fromMetaUrl));
  if (dir.endsWith(`${path.sep}src${path.sep}core`)) {
    return path.resolve(dir, '../..');
  }
  if (dir.endsWith(`${path.sep}scripts${path.sep}ci`)) {
    return dir;
  }
  return path.resolve(dir, '..');
}

/** Racine du dépôt open-task. */
export function repoRoot(fromMetaUrl = import.meta.url) {
  return path.resolve(packageRoot(fromMetaUrl), '../..');
}
