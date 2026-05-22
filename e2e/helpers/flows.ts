import { expect, type Page } from '@playwright/test';
import { pauseDemoStep } from './demo-pause';

export const DEMO_PASSWORD = 'password123';

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@example.com`;
}

/** Accueil chargé : sidebar desktop visible, ou bouton menu mobile. */
export async function assertLandOnHome(page: Page) {
  await expect(page).toHaveURL('/', { timeout: 30_000 });
  const mobileMenu = page.getByRole('button', { name: 'Ouvrir les listes' });
  if (await mobileMenu.isVisible()) {
    await expect(mobileMenu).toBeVisible();
    return;
  }
  await expect(page.getByRole('heading', { name: 'Listes' })).toBeVisible();
}

/** Panneau listes actif : tiroir mobile ou sidebar desktop (évite les doublons DOM). */
export function getListSidebar(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Menu des listes' });
  return dialog;
}

/** Ouvre le tiroir listes sur mobile. */
export async function ensureListSidebar(page: Page) {
  const mobileMenu = page.getByRole('button', { name: 'Ouvrir les listes' });
  if (!(await mobileMenu.isVisible())) return;
  const dialog = getListSidebar(page);
  if (!(await dialog.isVisible())) {
    await openMobileListDrawer(page);
  }
}

export async function closeMobileListDrawerIfOpen(page: Page) {
  const closeBtn = page.getByRole('button', { name: 'Fermer le menu' });
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await expect(page.getByRole('dialog', { name: 'Menu des listes' })).toBeHidden();
  }
}

export async function registerAndLandOnHome(
  page: Page,
  opts?: { firstName?: string; lastName?: string; email?: string },
) {
  const email = opts?.email ?? uniqueEmail('demo');
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

  await assertLandOnHome(page);
  await pauseDemoStep(page);

  return { email, firstName, lastName };
}

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(DEMO_PASSWORD);
  await page.getByTestId('login-submit').click();
  await assertLandOnHome(page);
}

export async function logoutFromApp(page: Page) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  await sidebar.getByTestId('logout-btn').click();
  await page.waitForURL('/login');
}

export async function createList(page: Page, name: string) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  const isMobile = await page.getByRole('button', { name: 'Ouvrir les listes' }).isVisible();

  await sidebar.getByTestId('create-list-btn').click();
  await sidebar.getByTestId('list-name-input').fill(name);
  await sidebar.getByTestId('list-create-submit').click();

  // Mobile : le tiroir se ferme après création (voir SidebarPanel.createList).
  if (isMobile) {
    await expect(page.locator('main').getByRole('heading', { name })).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(sidebar.getByRole('button', { name: new RegExp(name) }).first()).toBeVisible({
      timeout: 15_000,
    });
  }
  await closeMobileListDrawerIfOpen(page);
  await pauseDemoStep(page);
}

export async function activeListSidebar(page: Page) {
  const dialog = getListSidebar(page);
  if (await dialog.isVisible()) return dialog;
  return page.locator('aside.left-sidebar-desktop');
}

export async function addTask(page: Page, shortDescription: string, dueDate = '2026-12-31') {
  await page.getByTestId('add-task-btn').click();
  await page.getByTestId('task-short-input').fill(shortDescription);
  await page.getByTestId('task-due-date').fill(dueDate);
  await page.getByTestId('task-submit').click();
  await expect(page.getByText(shortDescription).first()).toBeVisible({ timeout: 15_000 });
  await pauseDemoStep(page, 700);
}

export async function switchView(page: Page, view: 'list' | 'kanban' | 'calendar') {
  await page.getByTestId(`view-${view}`).click();
  if (view === 'kanban') {
    await expect(page.getByRole('heading', { name: 'Kanban' })).toBeVisible();
  } else if (view === 'calendar') {
    await expect(page.getByRole('heading', { name: 'Calendrier' })).toBeVisible();
  }
  await pauseDemoStep(page, 900);
}

export async function openMobileListDrawer(page: Page) {
  await page.getByRole('button', { name: 'Ouvrir les listes' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu des listes' })).toBeVisible();
}

export async function selectListByName(page: Page, name: string) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  await sidebar.getByRole('button', { name: new RegExp(name) }).first().click();
  await closeMobileListDrawerIfOpen(page);
  await expect(page.locator('main').getByRole('heading', { name })).toBeVisible({ timeout: 15_000 });
  await pauseDemoStep(page);
}

export async function shareListWithEmail(
  page: Page,
  listName: string,
  inviteEmail: string,
  role: 'viewer' | 'editor' | 'admin' = 'editor',
) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  const listBtn = sidebar.getByRole('button', { name: new RegExp(listName) }).first();
  const shareBtn = listBtn.getByTestId('list-share-btn');
  const isMobile = await page.getByRole('button', { name: 'Ouvrir les listes' }).isVisible();
  if (!isMobile) await listBtn.hover();
  await shareBtn.click({ force: true });
  await expect(page.getByRole('heading', { name: 'Partager la liste' })).toBeVisible();
  await page.getByTestId('share-email-input').fill(inviteEmail);
  await page.getByTestId('share-role-select').selectOption(role);
  await page.getByTestId('share-submit').click();
  await expect(page.getByText(inviteEmail).first()).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('share-modal-close').click();
  await pauseDemoStep(page);
}

export async function switchTheme(page: Page, themeId: string) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  await sidebar.getByTestId('theme-picker-toggle').click();
  await page.getByTestId(`theme-option-${themeId}`).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', themeId);
  await pauseDemoStep(page, 900);
}

export async function setCalendarScale(page: Page, scale: 'month' | 'week' | 'day') {
  await switchView(page, 'calendar');
  await page.getByTestId(`calendar-scale-${scale}`).click();
  await pauseDemoStep(page, 1100);
}

/** Glisse une tâche (texte visible) vers la colonne Kanban d’une autre liste. */
export async function dragTaskToListInKanban(page: Page, taskLabel: string, targetListName: string) {
  await switchView(page, 'kanban');
  await pauseDemoStep(page, 400);
  const taskCard = page.locator('[draggable="true"]').filter({ hasText: taskLabel }).first();
  await expect(taskCard).toBeVisible();
  const targetColumn = page
    .locator('[data-testid^="kanban-column-"]')
    .filter({ has: page.getByRole('heading', { name: targetListName }) });
  await taskCard.scrollIntoViewIfNeeded();
  await targetColumn.scrollIntoViewIfNeeded();
  await taskCard.dragTo(targetColumn, { targetPosition: { x: 40, y: 120 } });
  await expect(targetColumn.filter({ hasText: taskLabel })).toBeVisible({ timeout: 20_000 });
  await pauseDemoStep(page, 1000);
}
