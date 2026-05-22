# Workflows GitHub Actions

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| [**CI**](ci.yml) | PR + push `main` / `develop` | Lint, tests, coverage, Codecov, wiki (main) |
| [**Docs**](docs.yml) | Push `main`, `workflow_dispatch` | Génération doc IA + VitePress → GitHub Pages |
| [**CodeQL**](codeql.yml) | PR + push (chemins code) | Analyse sécurité statique |

## CI (`ci.yml`)

```
backend ────────┐
frontend ───────┼──► report (Codecov + wiki sur main)
scripts ────────┘
e2e-playwright ───► Playwright (backend build + preview Nuxt + navigateur)
```

1. **backend** — Service Postgres (port 5432), Prisma migrate, tests unitaires puis **e2e avec `DATABASE_URL`** (sinon les tests passent mais la couverture e2e reste à 0 %). Vérification via `scripts/ci/assert-e2e-coverage.mjs`.
2. **frontend** — `nuxt prepare`, lint, Vitest coverage.
3. **scripts** — Vitest du pipeline `scripts/docs`.
4. **e2e-playwright** — Postgres, `nest build` + serveur backend, `nuxt build` + preview, scénario UI (inscription → liste → tâche → logout/login). Script : `scripts/ci/run-playwright-stack.sh`.
5. **report** — Télécharge les artefacts, fusionne les `coverage-summary.json`, publie Codecov et (sur `main` uniquement) le wiki.

Backend e2e (Jest) : `test/app-*.e2e-spec.ts` — auth (refresh, logout, `/me`), API (update, partage, révocation), flux existants. Garde-fou : `scripts/ci/assert-e2e-coverage.mjs` (≥ 55 % lignes e2e).

Local : `npm run test:e2e:playwright` (Docker Postgres 5433) ou `npm run test:e2e:playwright:ci` si Postgres déjà prêt.

## Docs (`docs.yml`)

Indépendant de la CI : génération longue (OpenRouter), build VitePress, déploiement Pages. Secret `OPENROUTER_API_KEY` requis sauf `workflow_dispatch` avec `skip_ai: true`.

## CodeQL (`codeql.yml`)

Toujours sur les PR (ruleset dépôt), même si seuls des fichiers markdown changent.
