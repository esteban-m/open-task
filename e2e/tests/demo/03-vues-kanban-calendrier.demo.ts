import { test } from '@playwright/test';
import { addTask, createList, registerAndLandOnHome, switchView } from '../../helpers/flows';

test.describe('Démo — Vues Kanban et Calendrier', () => {
  test('basculer entre liste, kanban et calendrier', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Planning');
    await addTask(page, 'Réunion équipe', '2026-06-15');

    await switchView(page, 'kanban');
    await page.waitForTimeout(1200);

    await switchView(page, 'calendar');
    await page.waitForTimeout(1200);

    await switchView(page, 'list');
    await page.waitForTimeout(800);
  });
});
