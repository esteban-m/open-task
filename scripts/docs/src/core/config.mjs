import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../config',
);

let cache = null;

export async function loadConfig(filename = 'open-task.docs.json') {
  if (!cache) {
    const raw = await readFile(path.join(CONFIG_DIR, filename), 'utf8');
    cache = JSON.parse(raw);
  }
  return cache;
}

export function resetConfigCache() {
  cache = null;
}
