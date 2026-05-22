import { test } from '@playwright/test';
import { addTask, openMobileListDrawer, registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Mobile', () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(testInfo.project.name !== 'demo-mobile', 'Scénario réservé au projet mobile');
  });

  test('menu listes et tâche sur petit écran', async ({ page }) => {
    await registerAndLandOnHome(page);
    await openMobileListDrawer(page);
    await page.getByTestId('create-list-btn').click();
    await page.getByTestId('list-name-input').fill('Mobile demo');
    await page.getByTestId('list-create-submit').click();
    await page.getByRole('button', { name: 'Fermer le menu' }).click();

    await addTask(page, 'Tâche mobile');
    await page.waitForTimeout(1000);
  });
});
