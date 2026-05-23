import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  pagesBaseFromRepo,
  runBuildPagesSite,
  writeSwaggerStatic,
} from '../src/build-pages-site.mjs';

describe('build-pages-site', () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'pages-site-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('pagesBaseFromRepo lit GITHUB_REPOSITORY', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'acme/mon-projet');
    expect(pagesBaseFromRepo(tmp)).toBe('/mon-projet/');
  });

  it('pagesBaseFromRepo lit config/open-task.docs.json', () => {
    const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
    vi.stubEnv('GITHUB_REPOSITORY', '');
    expect(pagesBaseFromRepo(repoRoot)).toBe('/open-task/');
  });

  it('writeSwaggerStatic résout swagger-ui-dist depuis backend', () => {
    const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
    const openapi = path.join(tmp, 'openapi-backend.json');
    writeFileSync(openapi, '{"openapi":"3.0.0"}');
    const out = path.join(tmp, 'swagger-backend');
    writeSwaggerStatic(out, openapi, repoRoot);
    expect(existsSync(path.join(out, 'swagger-ui.css'))).toBe(true);
  });

  it('writeSwaggerStatic copie openapi et génère index.html', () => {
    const swaggerUi = path.join(tmp, 'swagger-ui');
    const out = path.join(tmp, 'swagger-out');
    mkdirSync(swaggerUi, { recursive: true });
    writeFileSync(path.join(swaggerUi, 'swagger-ui.css'), 'body{}');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-bundle.js'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-standalone-preset.js'), '');

    const openapi = path.join(tmp, 'openapi.json');
    writeFileSync(openapi, '{"openapi":"3.0.0"}');

    writeSwaggerStatic(out, openapi, tmp, swaggerUi);

    expect(readFileSync(path.join(out, 'openapi.json'), 'utf8')).toContain('openapi');
    expect(readFileSync(path.join(out, 'index.html'), 'utf8')).toContain('swagger-ui');
  });

  it('runBuildPagesSite assemble hub, docs, storybook, swagger et démos', () => {
    const repo = path.join(tmp, 'repo');
    const hub = path.join(repo, 'site');
    const docsDist = path.join(repo, 'docs-dist');
    const storybook = path.join(repo, 'storybook-static');
    const demo = path.join(repo, 'demo');
    const swaggerUi = path.join(repo, 'swagger-ui');
    const out = path.join(repo, 'docs-site');

    mkdirSync(hub, { recursive: true });
    writeFileSync(path.join(hub, 'index.html'), '<html>__PAGES_BASE__docs/</html>');
    mkdirSync(docsDist, { recursive: true });
    writeFileSync(path.join(docsDist, 'index.html'), '<html>docs</html>');
    mkdirSync(storybook, { recursive: true });
    writeFileSync(path.join(storybook, 'index.html'), '<html>sb</html>');
    mkdirSync(demo, { recursive: true });
    writeFileSync(path.join(demo, 'readme.txt'), 'demo');
    mkdirSync(swaggerUi, { recursive: true });
    writeFileSync(path.join(swaggerUi, 'swagger-ui.css'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-bundle.js'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-standalone-preset.js'), '');

    const openapi = path.join(repo, 'openapi.json');
    writeFileSync(openapi, '{"paths":{}}');

    runBuildPagesSite(repo, {
      outDir: out,
      pagesBase: '/open-task/',
      hubDir: hub,
      docsDist,
      storybookDist: storybook,
      openapiJson: openapi,
      demoDir: demo,
      swaggerUiRoot: swaggerUi,
    });

    expect(readFileSync(path.join(out, 'index.html'), 'utf8')).toBe('<html>/open-task/docs/</html>');
    expect(readFileSync(path.join(out, 'docs', 'index.html'), 'utf8')).toContain('docs');
    expect(readFileSync(path.join(out, 'storybook', 'index.html'), 'utf8')).toContain('sb');
    expect(readFileSync(path.join(out, 'swagger', 'openapi.json'), 'utf8')).toContain('paths');
    expect(readFileSync(path.join(out, 'demo', 'readme.txt'), 'utf8')).toBe('demo');
  });

  it('runBuildPagesSite sans dossier démo', () => {
    const repo = path.join(tmp, 'repo-min');
    const hub = path.join(repo, 'site');
    const docsDist = path.join(repo, 'docs-dist');
    const storybook = path.join(repo, 'storybook-static');
    const swaggerUi = path.join(repo, 'swagger-ui');
    const out = path.join(repo, 'out');

    mkdirSync(hub, { recursive: true });
    writeFileSync(path.join(hub, 'index.html'), '<html>__PAGES_BASE__</html>');
    mkdirSync(docsDist, { recursive: true });
    writeFileSync(path.join(docsDist, 'index.html'), 'docs');
    mkdirSync(storybook, { recursive: true });
    writeFileSync(path.join(storybook, 'index.html'), 'sb');
    mkdirSync(swaggerUi, { recursive: true });
    writeFileSync(path.join(swaggerUi, 'swagger-ui.css'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-bundle.js'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-standalone-preset.js'), '');
    const openapi = path.join(repo, 'openapi.json');
    writeFileSync(openapi, '{}');

    runBuildPagesSite(repo, {
      outDir: out,
      pagesBase: '/x/',
      hubDir: hub,
      docsDist,
      storybookDist: storybook,
      openapiJson: openapi,
      demoDir: path.join(repo, 'missing-demo'),
      swaggerUiRoot: swaggerUi,
    });

    expect(existsSync(path.join(out, 'demo'))).toBe(false);
  });

  it('entrypoint CLI assemble le dépôt', () => {
    const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
    const hub = path.join(tmp, 'site-cli');
    const docsDist = path.join(tmp, 'docs-cli');
    const storybook = path.join(tmp, 'sb-cli');
    const swaggerUi = path.join(tmp, 'sw-cli');
    mkdirSync(hub, { recursive: true });
    writeFileSync(path.join(hub, 'index.html'), '__PAGES_BASE__');
    mkdirSync(docsDist, { recursive: true });
    mkdirSync(storybook, { recursive: true });
    mkdirSync(swaggerUi, { recursive: true });
    writeFileSync(path.join(swaggerUi, 'swagger-ui.css'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-bundle.js'), '');
    writeFileSync(path.join(swaggerUi, 'swagger-ui-standalone-preset.js'), '');

    const openapiPath = path.join(repoRoot, 'backend/openapi.json');
    if (!existsSync(openapiPath)) {
      writeFileSync(openapiPath, '{"openapi":"3.0.0"}');
    }

    vi.stubEnv('GITHUB_REPOSITORY', 'esteban-m/open-task');
    runBuildPagesSite(repoRoot, {
      outDir: path.join(tmp, 'cli-out'),
      hubDir: hub,
      docsDist,
      storybookDist: storybook,
      openapiJson: openapiPath,
      swaggerUiRoot: swaggerUi,
    });
    expect(existsSync(path.join(tmp, 'cli-out', 'index.html'))).toBe(true);
  });
});
