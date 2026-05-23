/** Snippet Vue affiché dans l’onglet Docs / panneau Code (copier-coller). */
export function vueUsageSnippet(code: string) {
  return {
    docs: {
      source: {
        type: 'code' as const,
        language: 'vue',
        code,
      },
    },
  };
}

export const storybookDocsDefaults = {
  docs: {
    codePanel: true,
    canvas: { sourceState: 'shown' as const },
    source: {
      type: 'dynamic' as const,
      excludeDecorators: true,
      language: 'vue',
    },
    toc: true,
  },
};
