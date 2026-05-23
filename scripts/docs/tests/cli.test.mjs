import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

vi.mock('../src/pipeline.mjs', () => ({ runPipeline: vi.fn() }));
vi.mock('../src/generators/assemble.mjs', () => ({ runAssemble: vi.fn() }));
vi.mock('../src/commands/validate-mistral.mjs', () => ({
  runValidateMistral: vi.fn(async () => 'mistral-small-latest'),
}));
vi.mock('../src/build-pages-site.mjs', () => ({
  runBuildPagesSite: vi.fn(),
}));

const { bootstrapCli, main, runCliEntry, shouldRunCli } = await import('../cli.mjs');
const { runValidateMistral } = await import('../src/commands/validate-mistral.mjs');
const { runBuildPagesSite } = await import('../src/build-pages-site.mjs');

describe('cli main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generate délègue à runPipeline', async () => {
    const { runPipeline } = await import('../src/pipeline.mjs');
    await main(['node', 'cli.mjs', 'generate']);
    expect(runPipeline).toHaveBeenCalled();
  });

  it('assemble délègue à runAssemble', async () => {
    const { runAssemble } = await import('../src/generators/assemble.mjs');
    await main(['node', 'cli.mjs', 'assemble']);
    expect(runAssemble).toHaveBeenCalled();
  });

  it('shouldRunCli true only for entrypoint argv', () => {
    const meta = 'file:///repo/scripts/docs/cli.mjs';
    expect(shouldRunCli(['node', '/repo/scripts/docs/cli.mjs'], meta)).toBe(true);
    expect(shouldRunCli(['node', '/repo/node_modules/vitest/vitest.mjs'], meta)).toBe(false);
  });

  it('bootstrapCli noop hors entrypoint', () => {
    bootstrapCli(['node', 'vitest'], 'file:///cli.mjs');
    expect(runValidateMistral).not.toHaveBeenCalled();
  });

  it('bootstrapCli lance runCliEntry sur entrypoint', async () => {
    const cliPath = fileURLToPath(new URL('../cli.mjs', import.meta.url));
    const meta = pathToFileURL(cliPath).href;
    bootstrapCli(['node', cliPath, 'validate-mistral'], meta);
    await new Promise((r) => setTimeout(r, 0));
    expect(runValidateMistral).toHaveBeenCalled();
  });

  it('bootstrapCli exit on error', async () => {
    runValidateMistral.mockRejectedValueOnce(new Error('fail'));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const cliPath = fileURLToPath(new URL('../cli.mjs', import.meta.url));
    const meta = pathToFileURL(cliPath).href;
    bootstrapCli(['node', cliPath, 'validate-mistral'], meta);
    await new Promise((r) => setTimeout(r, 50));
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });

  it('runCliEntry exécute main sur le entrypoint', async () => {
    const cliPath = fileURLToPath(new URL('../cli.mjs', import.meta.url));
    const meta = pathToFileURL(cliPath).href;
    await runCliEntry(['node', cliPath, 'validate-mistral'], meta);
    expect(runValidateMistral).toHaveBeenCalled();
  });

  it('runCliEntry noop hors entrypoint', async () => {
    await runCliEntry(['node', 'vitest'], 'file:///cli.mjs');
    expect(runValidateMistral).not.toHaveBeenCalled();
  });

  it('validate-mistral délègue à runValidateMistral', async () => {
    await main(['node', 'cli.mjs', 'validate-mistral']);
    expect(runValidateMistral).toHaveBeenCalled();
  });

  it('build-pages délègue à runBuildPagesSite', async () => {
    await main(['node', 'cli.mjs', 'build-pages']);
    expect(runBuildPagesSite).toHaveBeenCalled();
  });

  it('commande inconnue quitte avec code 1', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    await expect(main(['node', 'cli.mjs', 'unknown-cmd'])).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });
});
