import { expect, type Page } from '@playwright/test';

export const DEMO_PASSWORD = 'password123';

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@example.com`;
}

export async function registerAndLandOnHome(page: Page, opts?: { firstName?: string; lastName?: string }) {
  const email = uniqueEmail('demo');
  const firstName = opts?.firstName ?? 'Demo';
  const lastName = opts?.lastName ?? 'User';

  await page.goto('/register');
  await page.getByTestId('register-firstName').fill(firstName);
  await page.getByTestId('register-lastName').fill(lastName);
  await page.getByTestId('register-email').fill(email);
  await page.getByTestId('register-emailConfirm').fill(email);
  await page.getByTestId('register-password').fill(DEMO_PASSWORD);
  await page.getByTestId('register-passwordConfirm').fill(DEMO_PASSWORD);
  await page.getByTestId('register-submit').click();

  await expect(page).toHaveURL('/', { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Listes' })).toBeVisible();

  return { email, firstName, lastName };
}

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(DEMO_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/', { timeout: 30_000 });
}

export async function createList(page: Page, name: string) {
  await page.getByTestId('create-list-btn').click();
  await page.getByTestId('list-name-input').fill(name);
  await page.getByTestId('list-create-submit').click();
  await expect(page.getByRole('button', { name: new RegExp(name) }).first()).toBeVisible({
    timeout: 15_000,
  });
}

export async function addTask(page: Page, shortDescription: string, dueDate = '2026-12-31') {
  await page.getByTestId('add-task-btn').click();
  await page.getByTestId('task-short-input').fill(shortDescription);
  await page.getByTestId('task-due-date').fill(dueDate);
  await page.getByTestId('task-submit').click();
  await expect(page.getByText(shortDescription).first()).toBeVisible({ timeout: 15_000 });
}

export async function switchView(page: Page, view: 'list' | 'kanban' | 'calendar') {
  await page.getByTestId(`view-${view}`).click();
  if (view === 'kanban') {
    await expect(page.getByRole('heading', { name: 'Kanban' })).toBeVisible();
  } else if (view === 'calendar') {
    await expect(page.getByRole('heading', { name: 'Calendrier' })).toBeVisible();
  }
}

export async function openMobileListDrawer(page: Page) {
  await page.getByRole('button', { name: 'Ouvrir les listes' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu des listes' })).toBeVisible();
}
