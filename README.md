# Open-Task

[![CI](https://github.com/esteban-m/open-task/actions/workflows/ci.yml/badge.svg)](https://github.com/esteban-m/open-task/actions/workflows/ci.yml)

Gestionnaire de tâches temps réel — NestJS · Nuxt 3 · Tailwind CSS · PostgreSQL · WebSocket

---

## Démarrage rapide (3 commandes)

```bash
git clone https://github.com/esteban-m/open-task.git && cd open-task

cp .env.example .env
# Éditez .env : renseignez des secrets JWT forts (voir commentaires dans le fichier)

docker-compose up --build
```

L'application est disponible sur :
- **Frontend** → http://localhost:3000
- **API** → http://localhost:4000
- **Swagger** → http://localhost:4000/api

---

## Architecture globale

```
open-task/
├── backend/                  # NestJS
│   ├── src/
│   │   ├── auth/             # Module authentification (JWT, refresh token, profil /auth/me)
│   │   ├── lists/            # Module listes de tâches (+ partage)
│   │   ├── tasks/            # Module tâches + WebSocket Gateway
│   │   ├── prisma/           # Service Prisma (accès BDD)
│   │   └── common/           # Guards, décorateurs, filtres d'exception
│   ├── prisma/
│   │   ├── schema.prisma     # Modèles de données
│   │   └── migrations/       # Migrations SQL versionnées
│   └── test/                 # Tests e2e (Supertest)
│
├── frontend/                 # Nuxt 3
│   ├── pages/                # login.vue · register.vue · index.vue
│   ├── components/
│   │   ├── layout/           # Sidebars · ConfirmModal · vues liste/kanban/calendrier
│   │   ├── tasks/            # TaskCard · TaskForm
│   │   └── ui/               # ToastContainer · ThemePicker
│   ├── stores/               # Pinia : auth (session) · lists · tasks
│   ├── composables/          # useApi · useSocket · useRealtimeSync · useTheme
│   └── middleware/           # auth.ts (protection des routes)
│
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

### Couches back-end

Chaque module NestJS suit la séparation **Controller → Service → Prisma** :

| Couche | Responsabilité |
|---|---|
| Controller | Réception HTTP, extraction des paramètres, appel du service |
| Service | Logique métier, vérification de propriété (isolation userId) |
| Prisma | Accès base de données, requêtes typées |
| Gateway (WebSocket) | Handshake JWT, rooms Socket.io, émission d'événements |

---

## Justification des choix techniques

### Pourquoi Nuxt plutôt qu'une SPA Vue pure ?

Nuxt apporte le **routing fichier** (convention over configuration), les **middlewares de navigation** (protection des routes authentifiées déclarative), et le **SSR optionnel** pour de meilleures performances perçues. Pour une application avec authentification et navigation structurée, c'est plus adapté qu'une SPA Vue avec vue-router configuré manuellement.

### Pourquoi Pinia ?

Pinia est la solution de gestion d'état officielle pour Vue 3. Contrairement à Vuex, elle est typée nativement avec TypeScript, sans mutations boilerplate. Les trois stores (`auth`, `lists`, `tasks`) sont clairs et indépendants — le WebSocket met à jour le store tasks directement sans re-fetch HTTP.

### Architecture WebSocket

Le Gateway NestJS (`@WebSocketGateway`) avec Socket.io est organisé en **rooms par liste** (`list:{listId}`). Le flux est :

1. À la connexion WebSocket : vérification du JWT dans le handshake (`auth.token`) — toute connexion sans token valide est rejetée immédiatement.
2. Quand l'utilisateur sélectionne une liste : le client rejoint `join:list:{id}` et quitte l'ancienne room.
3. À chaque mutation (create/update/delete/toggle) : le contrôleur HTTP appelle le gateway qui émet vers la room — **tous les onglets et clients connectés sur cette liste voient la mise à jour en temps réel** sans re-fetch.
4. Côté Nuxt, le composable `useSocket` s'abonne aux événements (`task:created`, `task:updated`, `task:deleted`, `task:completed`) et applique les changements directement sur le store Pinia.

### Pourquoi Prisma ?

Prisma offre un ORM typé avec génération automatique du client TypeScript depuis le schéma. Les migrations versionnées (`prisma migrate`) garantissent la cohérence du schéma entre environnements. Les suppressions en cascade (liste → tâches, utilisateur → listes) sont déclarées dans le schéma, pas dans le code.

---

## Approche sécurité

### JWT dual-token

| Token | Durée | Stockage | Usage |
|---|---|---|---|
| Access token | 15 minutes | Mémoire Pinia (non persisté en localStorage) | Authentification de chaque requête HTTP |
| Refresh token | 7 jours | Cookie `httpOnly` + BDD | Renouvellement silencieux de l'access token |

Le refresh token est stocké en cookie `httpOnly` : il n'est pas accessible en JavaScript. L'access token reste en mémoire (store Pinia) et est restauré au chargement via `/auth/refresh`. En production, définir `COOKIE_SECURE=true` et des secrets JWT forts (voir `.env.example`).

**Durcissements** : Helmet (headers HTTP), rate limiting sur `/auth/*` (`@nestjs/throttler`), filtre d'exceptions global, validation stricte des DTOs.

### Rotation du refresh token

À chaque appel `/auth/refresh`, l'ancien refresh token est supprimé de la base et un nouveau est émis. Cela détecte les tentatives de réutilisation d'un token volé.

### Renouvellement transparent (intercepteur)

Le composable `useApi` gère automatiquement le cas 401 : il appelle `/auth/refresh`, met à jour le store, et rejoue la requête originale — **sans déconnexion visible** pour l'utilisateur. Les requêtes concurrentes sont mises en file d'attente pendant le refresh pour éviter les conditions de course.

### Isolation des données

`ListAccessService` vérifie l'accès à chaque liste/tâche (propriétaire ou membre invité avec rôle). Un utilisateur ne peut pas lire ni modifier les listes d'un autre sans partage explicite. Couvert par des tests e2e d'isolation (`test/app-isolation.e2e-spec.ts`).

---

## Tests

### Lancer les tests unitaires

```bash
cd backend
npm test
```

### Lancer les tests e2e

```bash
cd backend
# Requis : une base PostgreSQL de test accessible via DATABASE_URL
DATABASE_URL=postgresql://user:pass@localhost:5432/opentask_test npm run test:e2e
```

### Ce qui est couvert

- **`AuthService`** : register (succès, email dupliqué, hachage du mot de passe), login (succès, utilisateur inconnu, mauvais mot de passe), refresh (token manquant, token invalide).
- **`TasksService`** : findAllByList (succès, liste inexistante, accès interdit), create (succès, accès interdit), toggleComplete (vers terminée, vers active, tâche inexistante), remove (succès, accès interdit).
- **Tests e2e** : flux complet (`test/app.e2e-spec.ts`) + isolation multi-utilisateurs (`test/app-isolation.e2e-spec.ts`).
- **CI GitHub Actions** : lint backend + frontend, tests unitaires, migrations Prisma, tests e2e avec PostgreSQL.

---

## Fonctionnalités additionnelles (hors cahier des charges minimal)

- Partage de listes par email avec rôles (viewer / editor / admin)
- Vues **Kanban** et **calendrier**
- **10 thèmes** complets (clair/sombre) via variables CSS
- Toasts pour erreurs et confirmations
- Rendu **Markdown** dans les descriptions de tâches

---

## Ce qui aurait été fait différemment avec plus de temps

- **Pagination** des tâches côté API et scroll infini côté frontend pour les listes très chargées.
- **Tri et filtres** avancés des tâches (par échéance, par statut, recherche full-text).
- **Tests de composants Vue** avec Vitest et Vue Test Utils.
- **Access token httpOnly** côté API (BFF) pour éliminer totalement l'exposition JS du JWT court.
- **WebSocket e2e** automatisés (deux clients, propagation temps réel).

## Ce qui aurait été testé en priorité avec plus de temps

1. **Tests e2e WebSocket** : deux clients sur la même liste, vérification des événements `task:*` sans re-fetch.
2. **Tests du refresh token** front : expiration simulée → `/auth/refresh` → requête rejouée.
3. **Tests de composants** Vue (`TaskCard`, `TaskForm`, sidebars).
4. **Tests de charge** basiques sur le Gateway WebSocket (rooms, reconnexions).
5. **Audit sécurité** automatisé (OWASP ZAP, dépendances).
