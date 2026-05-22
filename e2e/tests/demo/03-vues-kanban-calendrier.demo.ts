import { test } from '@playwright/test';
import { pauseDemoScene, pauseDemoStep } from '../../helpers/demo-pause';
import { addTask, createList, registerAndLandOnHome, switchView } from '../../helpers/flows';

test.describe('Démo — Vues Kanban et Calendrier', () => {
  test('basculer entre liste, kanban et calendrier', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Planning');
    await addTask(page, 'Réunion équipe', '2026-06-15');

    await switchView(page, 'kanban');
    await pauseDemoStep(page, 1200);

    await switchView(page, 'calendar');
    await pauseDemoStep(page, 1200);

    await switchView(page, 'list');
    await pauseDemoScene(page);
  });
});
