import { test } from '@playwright/test';
import { pauseDemoScene, pauseDemoStep } from '../../helpers/demo-pause';
import { addTask, createList, registerAndLandOnHome, switchView } from '../../helpers/flows';

test.describe('Démo — Vues Kanban et Calendrier', () => {
  /** Titre court : Playwright tronque les dossiers test-results (sinon pas de GIF). */
  test('vues', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Planning');
    await addTask(page, 'Réunion équipe');

    await switchView(page, 'kanban');
    await pauseDemoStep(page, 1200);

    await switchView(page, 'calendar');
    await pauseDemoStep(page, 1200);

    await switchView(page, 'list');
    await pauseDemoScene(page);
  });
});
