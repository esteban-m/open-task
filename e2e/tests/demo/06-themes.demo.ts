import { test } from '@playwright/test';
import { pauseDemoScene } from '../../helpers/demo-pause';
import { registerAndLandOnHome, switchTheme } from '../../helpers/flows';

test.describe('Démo — Thèmes', () => {
  test('changer de palette (sombre puis clair)', async ({ page }) => {
    await registerAndLandOnHome(page);
    await switchTheme(page, 'abyss');
    await switchTheme(page, 'lumen');
    await pauseDemoScene(page);
  });
});
