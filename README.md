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
│   │   ├── auth/             # Module authentification (JWT, refresh token)
│   │   ├── users/            # Module utilisateurs
│   │   ├── lists/            # Module listes de tâches
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
│   │   ├── layout/           # LeftSidebar · MainContent · RightSidebar · ConfirmModal
│   │   └── tasks/            # TaskCard · TaskForm
│   ├── stores/               # Pinia : auth · lists · tasks
│   ├── composables/          # useApi (fetch + refresh) · useSocket (Socket.io)
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
| Access token | 15 minutes | Mémoire côté client (store Pinia) | Authentification de chaque requête HTTP |
| Refresh token | 7 jours | Cookie `httpOnly` + BDD | Renouvellement silencieux de l'access token |

Le refresh token est stocké en cookie `httpOnly` : il n'est pas accessible en JavaScript, ce qui protège contre les attaques XSS. Il est également persisté en base avec sa date d'expiration pour permettre la révocation (déconnexion).

### Rotation du refresh token

À chaque appel `/auth/refresh`, l'ancien refresh token est supprimé de la base et un nouveau est émis. Cela détecte les tentatives de réutilisation d'un token volé.

### Renouvellement transparent (intercepteur)

Le composable `useApi` gère automatiquement le cas 401 : il appelle `/auth/refresh`, met à jour le store, et rejoue la requête originale — **sans déconnexion visible** pour l'utilisateur. Les requêtes concurrentes sont mises en file d'attente pendant le refresh pour éviter les conditions de course.

### Isolation stricte par userId

Côté service NestJS, **chaque opération vérifie que la ressource appartient à l'utilisateur authentifié** (`list.userId !== userId` → `ForbiddenException`). Même avec un ID valide, un utilisateur ne peut pas accéder aux données d'un autre.

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
- **Test e2e** : flux complet — inscription → connexion → création liste → création tâche → toggle completed → suppression tâche → suppression liste → refus sans token.

---

## Ce qui aurait été fait différemment avec plus de temps

- **Refresh token côté frontend** : implémenter un vrai lock avec `Promise` partagée plutôt qu'une queue simple, pour être encore plus robuste en cas de nombreuses requêtes concurrentes.
- **Pagination** des tâches côté API et scroll infini côté frontend pour les listes très chargées.
- **Édition inline des tâches** dans le panneau de détail (RightSidebar), avec sauvegarde automatique.
- **Notifications toast** pour les erreurs et confirmations d'actions.
- **Tri et filtres** des tâches (par échéance, par statut).
- **Tests de composants Vue** avec Vitest et Vue Test Utils.
- **Rate limiting** sur les endpoints d'authentification (`@nestjs/throttler`).
- **Refresh automatique** du WebSocket en cas de reconnexion avec reprise de la room active.

## Ce qui aurait été testé en priorité avec plus de temps

1. **Tests e2e complets** sur les WebSockets (vérification de la propagation temps réel entre deux clients).
2. **Tests d'intégration** sur l'isolation des données (un utilisateur ne peut pas accéder aux listes d'un autre même en forçant les IDs).
3. **Tests de composants** Vue pour `TaskCard`, `TaskForm` et `LeftSidebar` (interactions, états, émission d'événements).
4. **Tests du mécanisme de refresh token** end-to-end : expiration de l'access token → renouvellement silencieux → requête rejouée.
5. **Tests de charge** basiques sur le Gateway WebSocket pour valider la gestion des rooms sous charge.
