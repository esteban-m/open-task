import { describe, expect, it } from 'vitest'

import { loadConfig, resetConfigCache } from '../src/core/config.mjs'

describe('loadConfig', () => {
  it('loads open-task.docs.json', async () => {
    resetConfigCache();
    const config = await loadConfig();
    expect(config.project.name).toBe('Open-Task');
    expect(config.chapters.length).toBeGreaterThan(0);
    expect(config.prompts.chapterSystem).toContain('Voir aussi');
  });
});
