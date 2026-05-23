/** Panneau Code uniquement — pas d’onglet Docs par composant. */
export const codePanelParameters = {
  docs: {
    disable: true,
    codePanel: true,
    canvas: { sourceState: 'shown' as const },
    source: {
      type: 'dynamic' as const,
      excludeDecorators: true,
      language: 'vue',
    },
  },
};
