import { test } from '@playwright/test';
import { registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Inscription', () => {
  test('créer un compte et arriver sur l’accueil', async ({ page }) => {
    await registerAndLandOnHome(page, { firstName: 'Alex', lastName: 'Demo' });
    await page.waitForTimeout(800);
  });
});
