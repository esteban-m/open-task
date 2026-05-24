import { addons } from 'storybook/manager-api';

import './addons/vue-usage-panel/register';

/** Ouvrir l’onglet Usage (2 encarts) par défaut. */
addons.setConfig({
  selectedPanel: 'open-task/vue-usage/panel',
});
