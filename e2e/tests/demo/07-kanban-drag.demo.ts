import { test } from '@playwright/test';
import { pauseDemoScene } from '../../helpers/demo-pause';
import {
  addTask,
  createList,
  dragTaskToListInKanban,
  registerAndLandOnHome,
  selectListByName,
} from '../../helpers/flows';

test.describe('Démo — Kanban drag & drop', () => {
  test('déplacer une tâche entre deux listes', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Backlog');
    await createList(page, 'En cours');
    await selectListByName(page, 'Backlog');
    await addTask(page, 'Carte à déplacer');

    await dragTaskToListInKanban(page, 'Carte à déplacer', 'En cours');
    await pauseDemoScene(page);
  });
});
