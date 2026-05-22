import { test } from '@playwright/test';
import { pauseDemoScene, pauseDemoStep } from '../../helpers/demo-pause';
import { addTask, createList, registerAndLandOnHome, setCalendarScale } from '../../helpers/flows';

test.describe('Démo — Calendrier', () => {
  test('échelles mois, semaine et jour', async ({ page }) => {
    await registerAndLandOnHome(page);
    await createList(page, 'Planning');
    await addTask(page, 'Rendez-vous démo', '2026-06-20');

    await setCalendarScale(page, 'month');
    await setCalendarScale(page, 'week');
    await setCalendarScale(page, 'day');
    await page.getByRole('button', { name: "Aujourd'hui" }).click();
    await pauseDemoStep(page, 1000);
    await pauseDemoScene(page);
  });
});
