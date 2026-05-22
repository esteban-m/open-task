import { expect, test } from '@playwright/test';
import {
  addTask,
  createList,
  DEMO_PASSWORD,
  registerAndLandOnHome,
} from '../../helpers/flows';

test.describe('Open-Task smoke', () => {
  test('inscription → liste → tâche → déconnexion → reconnexion', async ({ page }) => {
    const { email } = await registerAndLandOnHome(page);

    await createList(page, 'Liste Playwright');
    await addTask(page, 'Tâche E2E navigateur');

    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL('/login', { timeout: 15_000 });

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(DEMO_PASSWORD);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/', { timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Liste Playwright/ }).first()).toBeVisible();
    await expect(page.getByText('Tâche E2E navigateur').first()).toBeVisible();
  });
});
