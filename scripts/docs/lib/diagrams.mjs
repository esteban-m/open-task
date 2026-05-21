/** Diagrammes Mermaid versionnés (complètent les chapitres IA). */

export const AUTH_SEQUENCE = `sequenceDiagram
  participant C as Client Nuxt
  participant A as API NestJS
  participant DB as PostgreSQL

  C->>A: POST /auth/login
  A->>DB: find user + verify password
  A-->>C: access JWT + refresh cookie httpOnly
  C->>A: GET /auth/me (Bearer)
  A-->>C: profil utilisateur
`;

export const REALTIME_SEQUENCE = `sequenceDiagram
  participant C as Client Nuxt
  participant API as API NestJS
  participant G as TasksGateway
  participant DB as PostgreSQL

  C->>G: connect JWT + join list:id
  C->>API: POST /tasks
  API->>DB: persist task
  G-->>C: task:created (room list:id)
  Note over C: store Pinia mis à jour
`;

/** Où injecter chaque diagramme : { path, afterHeading, title, diagram } */
export const DIAGRAM_INJECTIONS = [
  {
    path: 'backend/authentication',
    afterHeading: '## Modèle JWT (access + refresh)',
    title: '## Flux d\'authentification',
    diagram: AUTH_SEQUENCE,
  },
  {
    path: 'explanation/realtime',
    afterHeading: '## Vue d\'ensemble',
    title: '## Flux temps réel',
    diagram: REALTIME_SEQUENCE,
  },
];

export function buildDiagramBlock(title, diagram) {
  return `\n${title}\n\n\`\`\`mermaid\n${diagram.trim()}\n\`\`\`\n`;
}

export function injectDiagram(markdown, { afterHeading, title, diagram }) {
  const block = buildDiagramBlock(title, diagram);
  if (markdown.includes(title)) return markdown;

  const idx = markdown.indexOf(afterHeading);
  if (idx === -1) {
    return `${markdown}\n${block}`;
  }

  const afterSection = markdown.indexOf('\n## ', idx + afterHeading.length);
  const insertAt = afterSection === -1 ? markdown.length : afterSection;
  return `${markdown.slice(0, insertAt)}${block}${markdown.slice(insertAt)}`;
}
