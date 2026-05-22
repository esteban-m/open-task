import path from 'node:path';

/**
 * @param {string} repoRoot
 * @param {import('./config.mjs').loadConfig extends () => Promise<infer C> ? C : never} config
 */
export function createPaths(repoRoot, config) {
  const p = config.paths;
  return {
    repoRoot,
    docsDir: path.join(repoRoot, p.docsDir),
    generatedDir: path.join(repoRoot, p.generatedDir),
    prismaSchema: path.join(repoRoot, p.prismaSchema),
    backendSrc: path.join(repoRoot, p.backendSrc),
    sidebarFile: path.join(repoRoot, p.vitepressSidebar),
    manifestFile: path.join(repoRoot, p.manifestFile),
    generatedFile: (name) => path.join(repoRoot, p.generatedDir, name),
    chapterFile: (chapterPath) =>
      path.join(repoRoot, p.generatedDir, `${chapterPath}.md`),
    sourceFile: (relative) => path.join(repoRoot, relative),
  };
}
