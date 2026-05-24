/** Panneau Usage (2 encarts) via addon local — pas d’autodocs. */
export const codePanelParameters = {
  docs: {
    codePanel: false,
    vueUsagePanel: true,
    canvas: { sourceState: 'shown' as const },
    source: {
      type: 'dynamic' as const,
      excludeDecorators: true,
      language: 'vue',
    },
  },
};
