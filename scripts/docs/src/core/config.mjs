import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { repoRoot } from '../../../ci/src/core/paths.mjs';

let cache = null;

function configDir() {
  return path.join(repoRoot(), 'config');
}

export async function loadConfig(filename = 'open-task.docs.json') {
  if (!cache) {
    const raw = await readFile(path.join(configDir(), filename), 'utf8');
    cache = JSON.parse(raw);
  }
  return cache;
}

export function resetConfigCache() {
  cache = null;
}
