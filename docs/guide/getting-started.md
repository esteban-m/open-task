# Démarrage rapide

Guide pas-à-pas pour lancer Open-Task en local avec Docker.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- Ports libres : `3000` (frontend), `4000` (API), `5432` (PostgreSQL optionnel en local)

## Installation

```bash
git clone https://github.com/esteban-m/open-task.git
cd open-task
cp .env.example .env
```

Éditez `.env` : remplacez les secrets `changeme_*` par des valeurs fortes avant tout déploiement réel.

## Lancer la stack

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API REST | http://localhost:4000 |
| Swagger | http://localhost:4000/api |

## Premier parcours

1. Ouvrir le frontend → **S'inscrire**
2. Créer une liste de tâches
3. Ajouter des tâches, tester le toggle « terminé »
4. Ouvrir un second onglet : les changements se synchronisent via WebSocket

## Développement sans Docker

Voir [CONTRIBUTING.md](https://github.com/esteban-m/open-task/blob/main/CONTRIBUTING.md) pour PostgreSQL local, migrations Prisma et `npm run start:dev` / `npm run dev`.

## Voir aussi

- [Introduction](/generated/guide/introduction)
- [Architecture](/generated/architecture)
- [Variables d'environnement](/reference/environment)
