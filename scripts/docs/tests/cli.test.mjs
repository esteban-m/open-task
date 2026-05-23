import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/pipeline.mjs', () => ({ runPipeline: vi.fn() }));
vi.mock('../src/generators/assemble.mjs', () => ({ runAssemble: vi.fn() }));
vi.mock('../src/commands/validate-mistral.mjs', () => ({
  runValidateMistral: vi.fn(async () => 'mistral-small-latest'),
}));

const { main } = await import('../cli.mjs');
const { runValidateMistral } = await import('../src/commands/validate-mistral.mjs');

describe('cli main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validate-mistral délègue à runValidateMistral', async () => {
    await main(['node', 'cli.mjs', 'validate-mistral']);
    expect(runValidateMistral).toHaveBeenCalled();
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
