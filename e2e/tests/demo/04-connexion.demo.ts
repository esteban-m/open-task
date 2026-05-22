import { test } from '@playwright/test';
import { createList, login, registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Connexion', () => {
  test('se connecter après inscription', async ({ page }) => {
    const { email } = await registerAndLandOnHome(page);
    await createList(page, 'Mes tâches');

    await page.getByTestId('logout-btn').click();
    await page.waitForURL('/login');

    await login(page, email);
    await page.waitForTimeout(1000);
  });
});
