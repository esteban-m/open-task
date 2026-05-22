import { test } from '@playwright/test';
import { createList, login, logoutFromApp, registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Connexion', () => {
  test('se connecter après inscription', async ({ page }) => {
    const { email } = await registerAndLandOnHome(page);
    await createList(page, 'Mes tâches');

    await logoutFromApp(page);

    await login(page, email);
    await page.waitForTimeout(1000);
  });
});
