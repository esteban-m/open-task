import { addons } from 'storybook/manager-api';

/** Ouvrir l’onglet Code par défaut (pas l’onglet Docs). */
addons.setConfig({
  selectedPanel: 'storybook/docs/panel',
});
