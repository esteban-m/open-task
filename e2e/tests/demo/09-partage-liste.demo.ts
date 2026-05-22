import { test, expect } from '@playwright/test';
import { pauseDemoScene } from '../../helpers/demo-pause';
import {
  activeListSidebar,
  createList,
  ensureListSidebar,
  login,
  logoutFromApp,
  registerAndLandOnHome,
  shareListWithEmail,
  uniqueEmail,
} from '../../helpers/flows';

test.describe('Démo — Partage de liste', () => {
  test('inviter un collègue et accéder à la liste partagée', async ({ page }) => {
    test.setTimeout(180_000);
    const ownerEmail = uniqueEmail('owner');
    const colleagueEmail = uniqueEmail('collegue');
    const listName = 'Projet équipe';

    await registerAndLandOnHome(page, {
      firstName: 'Alice',
      lastName: 'Owner',
      email: ownerEmail,
    });
    await createList(page, listName);
    await logoutFromApp(page);

    await registerAndLandOnHome(page, {
      firstName: 'Bob',
      lastName: 'Invite',
      email: colleagueEmail,
    });
    await logoutFromApp(page);

    await login(page, ownerEmail);
    await shareListWithEmail(page, listName, colleagueEmail, 'editor');
    await logoutFromApp(page);

    await login(page, colleagueEmail);
    await ensureListSidebar(page);
    const sidebar = await activeListSidebar(page);
    await expect(sidebar.getByRole('button', { name: new RegExp(listName) }).first()).toBeVisible();
    await expect(sidebar.getByText('partagée').first()).toBeVisible();
    await pauseDemoScene(page);
  });
});
