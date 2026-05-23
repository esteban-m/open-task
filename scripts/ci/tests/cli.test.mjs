import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/reports/merge-summaries.mjs', () => ({
  runMergeCoverage: vi.fn(),
}));
vi.mock('../src/reports/assert-e2e.mjs', () => ({
  runAssertE2e: vi.fn(),
}));

const { main, shouldRunCli } = await import('../cli.mjs');
const { runMergeCoverage } = await import('../src/reports/merge-summaries.mjs');

describe('cli', () => {
  it('shouldRunCli détecte le entrypoint', () => {
    const meta = new URL('../cli.mjs', import.meta.url).href;
    expect(shouldRunCli(['node', '/abs/cli.mjs'], meta)).toBe(false);
  });

  it('main délègue merge-coverage', async () => {
    await main(['node', 'cli.mjs', 'merge-coverage', '-o', 'out.json', 'a.json']);
    expect(runMergeCoverage).toHaveBeenCalledWith(['node', 'cli.mjs', '-o', 'out.json', 'a.json']);
  });
});
