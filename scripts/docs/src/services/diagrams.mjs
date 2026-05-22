export function buildDiagramBlock(sectionTitle, mermaid) {
  return `\n${sectionTitle}\n\n\`\`\`mermaid\n${mermaid.trim()}\n\`\`\`\n`;
}

export function injectDiagram(markdown, { afterHeading, sectionTitle, mermaid }) {
  const block = buildDiagramBlock(sectionTitle, mermaid);
  if (markdown.includes(sectionTitle)) return markdown;

  const idx = markdown.indexOf(afterHeading);
  if (idx === -1) return `${markdown}\n${block}`;

  const afterSection = markdown.indexOf('\n## ', idx + afterHeading.length);
  const insertAt = afterSection === -1 ? markdown.length : afterSection;
  return `${markdown.slice(0, insertAt)}${block}${markdown.slice(insertAt)}`;
}

/** Supprime les sections diagramme déjà injectées avant réinjection. */
export function stripDiagramSections(markdown, diagrams) {
  let md = markdown;
  for (const spec of diagrams) {
    const title = spec.sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    md = md.replace(new RegExp(`\\n${title}[\\s\\S]*?\`\`\`\\n`, 'g'), '\n');
  }
  return md;
}

import path from 'node:path';

export async function injectDiagramsIntoDir(generatedDir, diagrams, readFile, writeFile) {
  for (const spec of diagrams) {
    const file = path.join(generatedDir, `${spec.chapterPath}.md`);
    let md = await readFile(file, 'utf8');
    md = stripDiagramSections(md, [spec]);
    md = injectDiagram(md, {
      afterHeading: spec.afterHeading,
      sectionTitle: spec.sectionTitle,
      mermaid: spec.mermaid,
    });
    await writeFile(file, md, 'utf8');
    console.log(`[diagrams] ${spec.chapterPath}`);
  }
}
