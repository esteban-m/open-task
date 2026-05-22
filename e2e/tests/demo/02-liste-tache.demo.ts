import { test } from '@playwright/test';
import { pauseDemoScene } from '../../helpers/demo-pause';
import { addTask, createList, registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Liste et tâche', () => {
  test('créer une liste et une tâche', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Projet démo');
    await addTask(page, 'Préparer la revue de code');
    await pauseDemoScene(page);
  });
});
