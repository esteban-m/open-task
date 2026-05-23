import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { loadConfig } from '../src/core/config.mjs';
import { createPaths } from '../src/core/paths.mjs';
import { generateApiReference, parseController } from '../src/generators/api-reference.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const vitestDir = path.join(repoRoot, '.vitest-docs-api');

describe('parseController edge cases', () => {
  it('skips routes without async handler', () => {
    const content = `
@Controller('items')
export class ItemsController {
  @Get()
  findAll() {}
}
`;
    const { routes } = parseController(content, '/repo/items.controller.ts', '/repo');
    expect(routes).toHaveLength(0);
  });

  it('builds root path when prefix is empty', () => {
    const content = `
@Controller()
export class RootController {
  @Get()
  async health() {}
}
`;
    const { routes } = parseController(content, '/repo/root.controller.ts', '/repo');
    expect(routes).toEqual([{ method: 'GET', path: '/', handler: 'health' }]);
  });
});

describe('generateApiReference', () => {
  afterEach(async () => {
    await rm(vitestDir, { recursive: true, force: true });
  });

  it('writes api-reference.md from controller files', async () => {
    const backendSrc = path.join(vitestDir, 'backend/src');
    await mkdir(backendSrc, { recursive: true });
    await writeFile(
      path.join(backendSrc, 'demo.controller.ts'),
      `@Controller('demo')
export class DemoController {
  @Post('run')
  async run() {}
}
`,
      'utf8',
    );

    const config = await loadConfig();
    const paths = {
      ...createPaths(repoRoot, config),
      backendSrc,
      repoRoot,
      generatedFile: (name) => path.join(vitestDir, 'generated', name),
    };

    await generateApiReference(config, paths);

    const out = path.join(vitestDir, 'generated', 'api-reference.md');
    const md = await readFile(out, 'utf8');
    expect(md).toContain('Référence API REST');
    expect(md).toContain('| POST |');
    expect(md).toContain('task:created');
  });
});
