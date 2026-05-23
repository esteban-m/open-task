/** Panneau Code dynamique — pas d’autodocs (pas de tag, pas de `autodocs` dans main). */
export const codePanelParameters = {
  docs: {
    codePanel: true,
    canvas: { sourceState: 'shown' as const },
    source: {
      type: 'dynamic' as const,
      excludeDecorators: true,
      language: 'vue',
    },
  },
};
