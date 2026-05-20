<div align="center">

# Open-Task

**Gestionnaire de tâches collaboratif en temps réel**

[![CI](https://github.com/esteban-m/open-task/actions/workflows/ci.yml/badge.svg)](https://github.com/esteban-m/open-task/actions/workflows/ci.yml)
[![CodeQL](https://github.com/esteban-m/open-task/actions/workflows/codeql.yml/badge.svg)](https://github.com/esteban-m/open-task/actions/workflows/codeql.yml)
[![Dependabot](https://img.shields.io/endpoint?url=https%3A%2F%2Festeban-m.github.io%2Fopen-task%2Fbadges%2Fdependabot.json)](https://github.com/esteban-m/open-task/security/dependabot)
[![Code scanning](https://img.shields.io/endpoint?url=https%3A%2F%2Festeban-m.github.io%2Fopen-task%2Fbadges%2Fcode-scanning.json)](https://github.com/esteban-m/open-task/security/code-scanning)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Pinia](https://img.shields.io/badge/Pinia-state-FFD859?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)

[Démarrage rapide](#-démarrage-rapide) · [Fonctionnalités](#-fonctionnalités) · [Architecture](#-architecture) · [Sécurité](#-sécurité) · [Tests](#-tests) · [API Swagger](http://localhost:4000/api)

</div>

---

## Sommaire

- [Démarrage rapide](#-démarrage-rapide)
- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Choix techniques](#-choix-techniques)
- [Sécurité](#-sécurité)
- [Tests](#-tests)
- [Pistes d'amélioration](#-pistes-damélioration)

---

## Démarrage rapide

Trois commandes pour lancer l'ensemble de la stack (API, frontend, base de données) :

```bash
git clone https://github.com/esteban-m/open-task.git && cd open-task

cp .env.example .env
# Éditez .env : secrets JWT forts obligatoires en production (voir commentaires)

docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API REST | http://localhost:4000 |
| Swagger | http://localhost:4000/api |

> En production : définir `COOKIE_SECURE=true` et remplacer les secrets `changeme_*` du fichier `.env.example`.

---

## Fonctionnalités

### Cœur métier (cahier des charges)

- Authentification **email / mot de passe** (inscription avec confirmations)
- **JWT** dual-token : access (15 min) + refresh (7 j, cookie httpOnly)
- Listes de tâches : création, sélection, suppression avec confirmation
- Tâches : description courte / longue, échéance, statut terminé, section repliable
- **WebSocket** : synchronisation temps réel par liste (`task:created`, `updated`, `deleted`, `completed`)
- Panneau de détail latéral avec suppression confirmée

### Extensions

| Fonctionnalité | Description |
|----------------|-------------|
| Partage de listes | Invitation par email, rôles viewer / editor / admin |
| Vues multiples | Liste, **Kanban**, **calendrier** |
| Thèmes | 10 palettes complètes (clair & sombre) |
| Toasts | Retours utilisateur sur erreurs et succès |
| Markdown | Descriptions de tâches enrichies |

---

## Stack technique

| Couche | Technologies |
|--------|----------------|
| **Frontend** | Nuxt 3, Vue 3, Pinia, Tailwind CSS, socket.io-client |
| **Backend** | NestJS 10, Prisma, PostgreSQL, Passport JWT, Socket.io |
| **Ops** | Docker multi-stage, Docker Compose, GitHub Actions |
| **Qualité** | Jest (unit + e2e), ESLint, `nuxt typecheck` |

---

## Architecture

```
open-task/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── auth/             # JWT, refresh, profil /auth/me
│   │   ├── lists/            # Listes + partage
│   │   ├── tasks/            # Tâches + WebSocket Gateway
│   │   ├── prisma/           # Service Prisma
│   │   └── common/           # Guards, filtres, ListAccessService
│   ├── prisma/               # Schéma + migrations
│   └── test/                 # e2e Supertest
│
├── frontend/                 # Nuxt 3
│   ├── pages/                # login · register · index
│   ├── components/           # layout · tasks · ui
│   ├── stores/               # Pinia : auth · lists · tasks
│   ├── composables/          # useApi · useSocket · useRealtimeSync · useTheme
│   └── middleware/           # Protection des routes
│
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

### Couches back-end

| Couche | Rôle |
|--------|------|
| **Controller** | HTTP, validation des entrées (DTOs) |
| **Service** | Logique métier, contrôle d'accès |
| **Prisma** | Persistance typée |
| **Gateway** | Temps réel Socket.io, rooms par liste |

### Flux temps réel

```mermaid
sequenceDiagram
  participant Client as Client Nuxt
  participant API as API NestJS
  participant WS as TasksGateway
  participant DB as PostgreSQL

  Client->>API: POST /tasks (JWT)
  API->>DB: create task
  API->>WS: emit task:created
  WS-->>Client: event (room list:id)
  Note over Client: Mise à jour Pinia sans re-fetch
```

---

## Choix techniques

### Nuxt plutôt qu'une SPA Vue pure

Routing fichier, middlewares de navigation pour l'auth, et SSR optionnel sur les pages publiques. Structure adaptée à une app authentifiée multi-vues.

### Pinia

État global typé (`auth`, `lists`, `tasks`). Les événements WebSocket mettent à jour le store `tasks` directement, sans rechargement HTTP.

### Prisma

ORM typé, migrations versionnées, cascades déclaratives dans le schéma (suppression liste → tâches).

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| **Access token** | 15 min, mémoire Pinia uniquement |
| **Refresh token** | 7 j, cookie `httpOnly`, rotation à chaque refresh |
| **Intercepteur** | Renouvellement transparent via `useApi` |
| **Isolation** | `ListAccessService` — accès propriétaire ou membre invité |
| **Durcissement** | Helmet, rate limiting `/auth/*`, filtre d'exceptions global, DTOs validés |
| **CI / CodeQL** | Lint, tests e2e, analyse statique (`security-extended`) sur chaque PR |
| **Dependabot** | Mises à jour hebdo npm (backend + frontend) et GitHub Actions |

Les badges **Dependabot** et **Code scanning** sont alimentés par l’API GitHub et publiés sur [GitHub Pages](https://esteban-m.github.io/open-task/badges/) à chaque push sur `main` ([workflow](.github/workflows/pages-security-badges.yml), script `scripts/generate-security-badges.sh`).

Les tests e2e incluent un scénario d'**isolation multi-utilisateurs** (`test/app-isolation.e2e-spec.ts`).

---

## Tests

### Commandes

```bash
# Unit tests (backend)
cd backend && npm test

# e2e (PostgreSQL requis)
cd backend
DATABASE_URL=postgresql://user:pass@localhost:5432/opentask_test npm run test:e2e

# Lint
cd backend && npm run lint
cd frontend && npm run lint
```

### Couverture actuelle

| Suite | Contenu |
|-------|---------|
| `AuthService` | register, login, refresh, erreurs |
| `TasksService` | CRUD, accès, toggle, suppressions |
| **e2e flux complet** | register → login → liste → tâche → toggle → delete |
| **e2e isolation** | Utilisateur B ne accède pas aux données de A |
| **CI** | Lint, unit, migrations Prisma, e2e sur PostgreSQL |

---

## Pistes d'amélioration

**Avec plus de temps (dev)** — pagination, filtres avancés, tests composants Vue (Vitest), BFF pour access token httpOnly, e2e WebSocket multi-clients.

**Avec plus de temps (tests)** — propagation WS entre deux clients, refresh token front de bout en bout, tests de charge sur les rooms, audit OWASP / dépendances.

---

<div align="center">

Projet réalisé dans le cadre d'un cahier des charges **NestJS · Nuxt · PostgreSQL · WebSocket**

</div>
