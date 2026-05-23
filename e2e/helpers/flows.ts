import { expect, type Page } from '@playwright/test';
import { loadE2eConfig, todayIsoDateLocal } from '../../scripts/ci/src/core/e2e-config.mjs';
import { pauseDemoStep } from './demo-pause';

const cfg = loadE2eConfig();
const pauses = cfg.demo.pauses;
const timeouts = cfg.playwright;

export const testPassword = cfg.testUser.password;
/** @deprecated Utiliser testPassword — alias legacy des flows. */
export const DEMO_PASSWORD = testPassword;

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@${cfg.testUser.emailDomain}`;
}

export function todayIsoDate() {
  return todayIsoDateLocal();
}

/** Accueil chargé : sidebar desktop visible, ou bouton menu mobile. */
export async function assertLandOnHome(page: Page) {
  await expect(page).toHaveURL('/', { timeout: timeouts.navigationTimeoutMs });
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
  const dialog = getListSidebar(page);
  if (!(await dialog.isVisible())) return;
  if (await page.getByRole('heading', { name: 'Partager la liste' }).isVisible()) return;
  const panelClose = dialog.getByRole('button', { name: 'Fermer le panneau' });
  if (await panelClose.isVisible()) {
    await panelClose.click();
  } else {
    await dialog.getByRole('button', { name: 'Fermer le menu' }).click();
  }
  await expect(dialog).toBeHidden();
}

export async function registerAndLandOnHome(
  page: Page,
  opts?: { firstName?: string; lastName?: string; email?: string },
) {
  const email = opts?.email ?? uniqueEmail('demo');
  const firstName = opts?.firstName ?? cfg.testUser.defaultFirstName;
  const lastName = opts?.lastName ?? cfg.testUser.defaultLastName;

  await page.goto('/register');
  await page.getByTestId('register-firstName').fill(firstName);
  await page.getByTestId('register-lastName').fill(lastName);
  await page.getByTestId('register-email').fill(email);
  await page.getByTestId('register-emailConfirm').fill(email);
  await page.getByTestId('register-password').fill(testPassword);
  await page.getByTestId('register-passwordConfirm').fill(testPassword);
  const registerDone = page.waitForResponse(
    (r) => r.url().includes('/auth/register') && r.status() === 201,
  );
  await page.getByTestId('register-submit').click();
  await registerDone;

  await assertLandOnHome(page);
  await pauseDemoStep(page);

  return { email, firstName, lastName };
}

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(testPassword);
  await page.getByTestId('login-submit').click();
  await assertLandOnHome(page);
}

export async function logoutFromApp(page: Page) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  await sidebar.getByTestId('logout-btn').click();
  await page.waitForURL('/login', { timeout: timeouts.navigationTimeoutMs });
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
    await expect(page.locator('main').getByRole('heading', { name })).toBeVisible({ timeout: timeouts.expectTimeoutMs });
  } else {
    await expect(sidebar.getByRole('button', { name: new RegExp(name) }).first()).toBeVisible({
      timeout: timeouts.expectTimeoutMs,
    });
  }
  await closeMobileListDrawerIfOpen(page);
  await pauseDemoStep(page);
}

export async function activeListSidebar(page: Page) {
  const mobileMenu = page.getByRole('button', { name: 'Ouvrir les listes' });
  if (await mobileMenu.isVisible()) {
    await ensureListSidebar(page);
    return getListSidebar(page);
  }
  return page.locator('aside.left-sidebar-desktop');
}

export async function addTask(page: Page, shortDescription: string, dueDate = todayIsoDate()) {
  await page.getByTestId('add-task-btn').click();
  await page.getByTestId('task-short-input').fill(shortDescription);
  await page.getByTestId('task-due-date').fill(dueDate);
  await page.getByTestId('task-submit').click();
  await expect(page.getByText(shortDescription).first()).toBeVisible({ timeout: timeouts.expectTimeoutMs });
  await pauseDemoStep(page, pauses.afterTaskMs);
}

export async function switchView(page: Page, view: 'list' | 'kanban' | 'calendar') {
  await page.getByTestId(`view-${view}`).click();
  if (view === 'kanban') {
    await expect(page.getByRole('heading', { name: 'Kanban' })).toBeVisible();
  } else if (view === 'calendar') {
    await expect(page.getByRole('heading', { name: 'Calendrier' })).toBeVisible();
  }
  await pauseDemoStep(page, pauses.afterViewMs);
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
  await expect(page.locator('main').getByRole('heading', { name })).toBeVisible({ timeout: timeouts.expectTimeoutMs });
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
  // Ne pas fermer le tiroir ici : le backdrop est sous la modale (z-110) → clic bloqué jusqu'au timeout test.
  await expect(page.getByRole('heading', { name: 'Partager la liste' })).toBeVisible({ timeout: timeouts.expectTimeoutMs });
  await page.getByTestId('share-email-input').fill(inviteEmail);
  await page.getByTestId('share-role-select').selectOption(role);
  await page.getByTestId('share-submit').click();
  await expect(page.getByText(inviteEmail).first()).toBeVisible({ timeout: timeouts.expectTimeoutMs });
  await page.getByTestId('share-modal-close').click();
  if (isMobile) await closeMobileListDrawerIfOpen(page);
  await pauseDemoStep(page);
}

export async function switchTheme(page: Page, themeId: string) {
  await ensureListSidebar(page);
  const sidebar = await activeListSidebar(page);
  await sidebar.getByTestId('theme-picker-toggle').click();
  await page.getByTestId(`theme-option-${themeId}`).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', themeId);
  await pauseDemoStep(page, pauses.afterThemeMs);
}

export async function setCalendarScale(page: Page, scale: 'month' | 'week' | 'day') {
  await switchView(page, 'calendar');
  await page.getByTestId(`calendar-scale-${scale}`).click();
  await pauseDemoStep(page, pauses.afterCalendarScaleMs);
}

/** Glisse une tâche (texte visible) vers la colonne Kanban d’une autre liste. */
export async function dragTaskToListInKanban(page: Page, taskLabel: string, targetListName: string) {
  await switchView(page, 'kanban');
  await pauseDemoStep(page, pauses.beforeDragMs);
  const taskCard = page.locator('[draggable="true"]').filter({ hasText: taskLabel }).first();
  await expect(taskCard).toBeVisible();
  const targetColumn = page
    .locator('[data-testid^="kanban-column-"]')
    .filter({ has: page.getByRole('heading', { name: targetListName }) });
  await taskCard.scrollIntoViewIfNeeded();
  await targetColumn.scrollIntoViewIfNeeded();
  await taskCard.dragTo(targetColumn, { targetPosition: { x: 40, y: 120 } });
  await expect(targetColumn.filter({ hasText: taskLabel })).toBeVisible({ timeout: timeouts.expectTimeoutMs + 5000 });
  await pauseDemoStep(page, pauses.afterDragMs);
}
