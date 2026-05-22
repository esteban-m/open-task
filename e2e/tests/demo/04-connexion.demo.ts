import { test } from '@playwright/test';
import { pauseDemoScene, pauseDemoStep } from '../../helpers/demo-pause';
import { createList, login, logoutFromApp, registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Connexion', () => {
  test('se connecter après inscription', async ({ page }) => {
    const { email } = await registerAndLandOnHome(page);
    await createList(page, 'Mes tâches');

    await logoutFromApp(page);
    await pauseDemoStep(page, 800);

    await login(page, email);
    await pauseDemoScene(page);
  });
});
