import { expect, test } from '@playwright/test';

const password = 'password123';

test.describe('Open-Task full-stack', () => {
  test('inscription → liste → tâche → déconnexion → reconnexion', async ({ page }) => {
    const email = `pw-${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByTestId('register-firstName').fill('Play');
    await page.getByTestId('register-lastName').fill('Wright');
    await page.getByTestId('register-email').fill(email);
    await page.getByTestId('register-emailConfirm').fill(email);
    await page.getByTestId('register-password').fill(password);
    await page.getByTestId('register-passwordConfirm').fill(password);
    await page.getByTestId('register-submit').click();

    await expect(page).toHaveURL('/', { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Listes' })).toBeVisible();

    await page.getByTestId('create-list-btn').click();
    await page.getByTestId('list-name-input').fill('Liste Playwright');
    await page.getByTestId('list-create-submit').click();
    await expect(page.getByText('Liste Playwright')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('add-task-btn').click();
    await page.getByTestId('task-short-input').fill('Tâche E2E navigateur');
    await page.getByTestId('task-due-date').fill('2026-12-31');
    await page.getByTestId('task-submit').click();
    await expect(page.getByText('Tâche E2E navigateur')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL('/login', { timeout: 15_000 });

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/', { timeout: 30_000 });
    await expect(page.getByText('Liste Playwright')).toBeVisible();
    await expect(page.getByText('Tâche E2E navigateur')).toBeVisible();
  });
});
