# Contribuer à Open-Task

Merci de votre intérêt pour ce projet. Les retours, corrections et améliorations sont les bienvenus.

## Avant de commencer

- Lisez le [README](README.md) pour l’architecture et le démarrage local.
- Consultez le [code de conduite](CODE_OF_CONDUCT.md) : tout participant doit le respecter.

## Signaler un bug ou proposer une idée

1. Vérifiez qu’[une issue similaire](https://github.com/esteban-m/open-task/issues) n’existe pas déjà.
2. Utilisez les modèles GitHub : **Bug** ou **Fonctionnalité** (*New issue* → choix du formulaire).
3. Pour une **vulnérabilité de sécurité**, suivez [.github/SECURITY.md](.github/SECURITY.md) — signalement **privé** uniquement, pas d’issue publique avec détails exploitables.

## Environnement de développement

```bash
git clone https://github.com/esteban-m/open-task.git && cd open-task
cp .env.example .env
docker compose up --build
```

Sans Docker, lancez PostgreSQL localement et suivez les variables du `.env.example` pour `backend/` et `frontend/` séparément.

## Workflow de contribution

1. **Fork** le dépôt et créez une branche depuis `main` :
   - `fix/...` — correction de bug
   - `feat/...` — nouvelle fonctionnalité
   - `docs/...` — documentation uniquement
2. **Commits** : messages courts en français ou en anglais, à l’impératif (*Ajoute…*, *Corrige…*).
3. **Tests** avant la PR :
   ```bash
   cd backend && npm run lint && npm test
   npm run test:coverage
   # e2e backend (PostgreSQL requis) :
   DATABASE_URL=postgresql://test:test@127.0.0.1:5433/opentask_test npm run test:e2e
   cd frontend && npm run lint && npm test
   # e2e full-stack (Postgres + backend + frontend + Playwright) :
   npm run test:e2e:playwright
   ```
4. Ouvrez une **pull request** vers `main` : le modèle [.github/pull_request_template.md](.github/pull_request_template.md) est pré-rempli (résumé, `Fixes #123`, checklist tests / secrets).

La CI (lint, unit, e2e, CodeQL) doit passer ; les revues peuvent demander des ajustements.

## Conventions de code

| Zone | Attendu |
|------|---------|
| **Backend** | NestJS : controllers fins, logique dans les services, DTOs validés, accès listes via `ListAccessService` |
| **Frontend** | Composition API, Pinia pour l’état global, pas de `v-html` non sanitizé |
| **Sécurité** | Pas de secrets dans le repo ; JWT et cookies documentés dans `.env.example` |
| **Style** | Suivre le lint existant (`eslint` backend, `nuxt typecheck` frontend) |

## Périmètre des PRs

Les PRs focalisées (un sujet, diff raisonnable) sont plus faciles à revoir. Pour les refontes larges, ouvrez d’abord une issue pour en discuter.

## Questions

Pour toute question non couverte par ce guide, ouvrez une issue avec le label approprié ou contactez le mainteneur via les issues GitHub.
