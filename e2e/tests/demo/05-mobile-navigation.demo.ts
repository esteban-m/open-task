import { test } from '@playwright/test';
import { pauseDemoScene } from '../../helpers/demo-pause';
import { addTask, createList, registerAndLandOnHome } from '../../helpers/flows';

test.describe('Démo — Mobile', () => {
  test('menu listes et tâche sur petit écran', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Mobile demo');

    await addTask(page, 'Tâche mobile');
    await pauseDemoScene(page);
  });
});
