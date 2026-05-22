export function sanitizeMermaid(code) {
  let out = code.trim();

  out = out.replace(/(\b[A-Za-z][\w]*)\[([^\]"\n]+)\]/g, (_, id, label) => {
    const trimmed = label.trim();
    if (/["']/.test(trimmed)) return `${id}[${label}]`;
    if (/[\s():/|&]/.test(trimmed)) {
      return `${id}["${trimmed.replace(/"/g, "'")}"]`;
    }
    return `${id}[${trimmed}]`;
  });

  return out.replace(/\n{3,}/g, '\n\n');
}

export async function fixMermaidInMarkdown(filePath, readFile, writeFile) {
  let content = await readFile(filePath, 'utf8');
  const replaced = content.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_, block) => `\`\`\`mermaid\n${sanitizeMermaid(block)}\n\`\`\``,
  );
  if (replaced !== content) {
    await writeFile(filePath, replaced, 'utf8');
    return true;
  }
  return false;
}
