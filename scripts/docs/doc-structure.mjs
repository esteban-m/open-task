/**
 * Structure doc-as-code (Diátaxis) — navigation et chapitres IA.
 * Une entrée = un sujet cohérent, pas un fichier isolé.
 */

export const DOC_CATEGORIES = [
  { id: 'guide', text: 'Guide', order: 1 },
  { id: 'explanation', text: 'Comprendre le système', order: 2 },
  { id: 'backend', text: 'Backend (NestJS)', order: 3 },
  { id: 'frontend', text: 'Frontend (Nuxt)', order: 4 },
  { id: 'reference', text: 'Référence', order: 5 },
  { id: 'operations', text: 'Exploitation', order: 6 },
];

/** Pages versionnées dans git (pas d'IA). */
export const STATIC_PAGES = [
  {
    category: 'guide',
    link: '/guide/getting-started',
    title: 'Démarrage rapide',
  },
  {
    category: 'reference',
    link: '/reference/environment',
    title: 'Variables d\'environnement',
  },
  {
    category: 'operations',
    link: '/operations/docker',
    title: 'Docker & services',
  },
];

/** Pages générées sous docs/generated/ — une requête IA par chapitre. */
export const GENERATED_SECTIONS = [
  {
    category: 'guide',
    path: 'guide/introduction',
    title: 'Introduction',
    outline: [
      '## Objectif du projet',
      '## Fonctionnalités principales',
      '## Stack technique',
      '## Organisation du dépôt',
    ],
    sources: ['README.md', 'backend/src/app.module.ts'],
  },
  {
    category: 'explanation',
    path: 'explanation/realtime',
    title: 'Temps réel (WebSocket)',
    outline: [
      '## Vue d\'ensemble',
      '## Rooms Socket.io',
      '## Événements émis',
      '## Flux côté client',
      '## Synchronisation Pinia',
    ],
    sources: [
      'backend/src/tasks/tasks.gateway.ts',
      'frontend/composables/useSocket.ts',
      'frontend/composables/useRealtimeSync.ts',
      'frontend/plugins/realtime.client.ts',
    ],
  },
  {
    category: 'backend',
    path: 'backend/authentication',
    title: 'Authentification',
    outline: [
      '## Modèle JWT (access + refresh)',
      '## Endpoints',
      '## Cookies httpOnly',
      '## Rotation des refresh tokens',
      '## Stratégie Passport',
    ],
    sources: [
      'backend/src/auth/auth.controller.ts',
      'backend/src/auth/auth.service.ts',
      'backend/src/auth/jwt.strategy.ts',
      'backend/src/auth/auth-cookie.ts',
      'backend/src/auth/refresh-token-hash.ts',
      'backend/src/auth/dto/auth.dto.ts',
    ],
  },
  {
    category: 'backend',
    path: 'backend/lists-and-sharing',
    title: 'Listes & partage',
    outline: [
      '## Modèle de données',
      '## CRUD listes',
      '## Invitations & rôles',
      '## Contrôle d\'accès (ListAccessService)',
    ],
    sources: [
      'backend/src/lists/lists.controller.ts',
      'backend/src/lists/lists.service.ts',
      'backend/src/lists/dto/list.dto.ts',
      'backend/src/lists/dto/share-list.dto.ts',
      'backend/src/common/list-access/list-access.service.ts',
      'backend/prisma/schema.prisma',
    ],
  },
  {
    category: 'backend',
    path: 'backend/tasks',
    title: 'Tâches',
    outline: [
      '## CRUD & règles métier',
      '## Validation (DTOs)',
      '## Gateway temps réel',
      '## Isolation par liste',
    ],
    sources: [
      'backend/src/tasks/tasks.controller.ts',
      'backend/src/tasks/tasks.service.ts',
      'backend/src/tasks/tasks.gateway.ts',
      'backend/src/tasks/dto/task.dto.ts',
    ],
  },
  {
    category: 'backend',
    path: 'backend/security',
    title: 'Sécurité transverse',
    outline: [
      '## Durcissement HTTP',
      '## Guards & filtres',
      '## Validation production',
      '## Bonnes pratiques appliquées',
    ],
    sources: [
      'backend/src/main.ts',
      'backend/src/common/guards/jwt-auth.guard.ts',
      'backend/src/common/filters/all-exceptions.filter.ts',
      'backend/src/common/filters/http-exception.filter.ts',
      'backend/src/common/config/validate-production-secrets.ts',
    ],
  },
  {
    category: 'frontend',
    path: 'frontend/application',
    title: 'Application Nuxt',
    outline: [
      '## Routing & middleware auth',
      '## Configuration Nuxt',
      '## Client API & intercepteurs',
      '## Initialisation session',
    ],
    sources: [
      'frontend/nuxt.config.ts',
      'frontend/middleware/auth.ts',
      'frontend/composables/useApi.ts',
      'frontend/composables/useAuth.ts',
      'frontend/composables/useSessionInit.ts',
      'frontend/plugins/auth-init.client.ts',
    ],
  },
  {
    category: 'frontend',
    path: 'frontend/state-management',
    title: 'État Pinia',
    outline: [
      '## Stores auth, lists, tasks',
      '## Relations entre stores',
      '## Mise à jour via WebSocket',
    ],
    sources: [
      'frontend/stores/auth.ts',
      'frontend/stores/lists.ts',
      'frontend/stores/tasks.ts',
    ],
  },
  {
    category: 'frontend',
    path: 'frontend/views',
    title: 'Vues & interface',
    outline: [
      '## Pages principales',
      '## Vues liste, Kanban, calendrier',
      '## Thèmes & Markdown',
      '## Composants clés',
    ],
    sources: [
      'frontend/pages/index.vue',
      'frontend/pages/login.vue',
      'frontend/components/kanban/KanbanView.vue',
      'frontend/components/calendar/CalendarView.vue',
      'frontend/composables/useTheme.ts',
      'frontend/composables/useMarkdown.ts',
    ],
  },
];

/** Pages générées par scripts dédiés (schéma, API, architecture). */
export const SPECIAL_GENERATED = [
  {
    category: 'explanation',
    link: '/generated/architecture',
    title: 'Architecture système',
    file: 'architecture.md',
  },
  {
    category: 'explanation',
    link: '/generated/database',
    title: 'Modèle de données (ERD)',
    file: 'database.md',
  },
  {
    category: 'reference',
    link: '/generated/api-reference',
    title: 'API REST',
    file: 'api-reference.md',
  },
];
