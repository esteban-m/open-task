import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/reports/merge-summaries.mjs', () => ({
  runMergeCoverage: vi.fn(),
}));
vi.mock('../src/reports/assert-e2e.mjs', () => ({
  runAssertE2e: vi.fn(),
}));
vi.mock('../src/reports/summary-markdown.mjs', () => ({
  runCoverageMarkdown: vi.fn(),
}));
vi.mock('../src/reports/wiki-pages.mjs', () => ({
  runWikiPages: vi.fn(),
}));
vi.mock('../src/playwright/videos-to-gifs.mjs', () => ({
  runVideosToGifs: vi.fn(),
}));
vi.mock('../src/core/e2e-config.mjs', () => ({
  printStackEnv: vi.fn(() => 'export FOO=bar\n'),
}));
vi.mock('../src/reports/fix-lcov-paths.mjs', () => ({
  runFixLcovPaths: vi.fn(),
}));

const { main, runCliEntry, shouldRunCli } = await import('../cli.mjs');
const { runMergeCoverage } = await import('../src/reports/merge-summaries.mjs');
const { runAssertE2e } = await import('../src/reports/assert-e2e.mjs');
const { runCoverageMarkdown } = await import('../src/reports/summary-markdown.mjs');
const { runWikiPages } = await import('../src/reports/wiki-pages.mjs');
const { runVideosToGifs } = await import('../src/playwright/videos-to-gifs.mjs');
const { printStackEnv } = await import('../src/core/e2e-config.mjs');
const { runFixLcovPaths } = await import('../src/reports/fix-lcov-paths.mjs');

describe('cli', () => {
  it('shouldRunCli détecte le entrypoint', () => {
    const meta = new URL('../cli.mjs', import.meta.url).href;
    expect(shouldRunCli(['node', '/abs/cli.mjs'], meta)).toBe(false);
    const cliPath = fileURLToPath(new URL('../cli.mjs', import.meta.url));
    expect(shouldRunCli(['node', cliPath], meta)).toBe(true);
  });

  it('main délègue merge-coverage', async () => {
    await main(['node', 'cli.mjs', 'merge-coverage', '-o', 'out.json', 'a.json']);
    expect(runMergeCoverage).toHaveBeenCalledWith(['node', 'cli.mjs', '-o', 'out.json', 'a.json']);
  });

  it('main délègue assert-e2e, coverage-markdown, wiki-pages, gifs, fix-lcov-paths', async () => {
    await main(['node', 'cli.mjs', 'assert-e2e', 'summary.json']);
    await main(['node', 'cli.mjs', 'coverage-markdown', '--summary', 's.json']);
    await main(['node', 'cli.mjs', 'wiki-pages', '--out-dir', 'out']);
    await main(['node', 'cli.mjs', 'gifs']);
    await main(['node', 'cli.mjs', 'fix-lcov-paths', 'lcov.info', 'backend']);
    expect(runAssertE2e).toHaveBeenCalled();
    expect(runCoverageMarkdown).toHaveBeenCalled();
    expect(runWikiPages).toHaveBeenCalled();
    expect(runVideosToGifs).toHaveBeenCalled();
    expect(runFixLcovPaths).toHaveBeenCalledWith([
      'node',
      'cli.mjs',
      'lcov.info',
      'backend',
    ]);
  });

  it('stack-env écrit sur stdout', async () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await main(['node', 'cli.mjs', 'stack-env']);
    expect(printStackEnv).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('export FOO=bar\n');
    spy.mockRestore();
  });

  it('commande inconnue quitte avec code 1', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await main(['node', 'cli.mjs', 'unknown-cmd']);
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    err.mockRestore();
  });

  it('runCliEntry ignore un entrypoint différent', async () => {
    vi.clearAllMocks();
    const meta = new URL('../cli.mjs', import.meta.url).href;
    await runCliEntry(['node', '/autre/cli.mjs'], meta);
    expect(runMergeCoverage).not.toHaveBeenCalled();
  });

  it('runCliEntry quitte sur erreur', async () => {
    const meta = new URL('../cli.mjs', import.meta.url).href;
    const cliPath = fileURLToPath(new URL('../cli.mjs', import.meta.url));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(runMergeCoverage).mockImplementation(() => {
      throw new Error('boom');
    });
    await runCliEntry(['node', cliPath, 'merge-coverage'], meta);
    expect(err).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    err.mockRestore();
  });
});
