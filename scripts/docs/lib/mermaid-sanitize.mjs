/**
 * Corrige les labels Mermaid pour le rendu (espaces, parenthèses → guillemets).
 */
export function sanitizeMermaid(code) {
  let out = code.trim();

  // A[Label] → A["Label"] si label contient caractères spéciaux
  out = out.replace(/(\b[A-Za-z][\w]*)\[([^\]"\n]+)\]/g, (_, id, label) => {
    const trimmed = label.trim();
    if (/["']/.test(trimmed)) return `${id}[${label}]`;
    if (/[\s():/|&]/.test(trimmed)) {
      return `${id}["${trimmed.replace(/"/g, "'")}"]`;
    }
    return `${id}[${trimmed}]`;
  });

  // Supprime les lignes vides en trop
  return out.replace(/\n{3,}/g, '\n\n');
}
