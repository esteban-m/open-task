# Workflows GitHub Actions

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| [**CI**](ci.yml) | PR + push `main` / `develop`, `workflow_dispatch` | Lint, tests, coverage, Codecov, wiki (main) |
| [**Docs**](docs.yml) | Push `main`, `workflow_dispatch` | Génération doc IA + VitePress → GitHub Pages |
| [**Demo assets**](demo-assets.yml) | PR + push `main`, `workflow_dispatch` | Playwright → GIF ; artefact sur PR, commit sur `main` |

**Push `main`** : chaque merge ou commit sur `main` déclenche **CI**, **CodeQL** (si chemins code), **Docs** et **Demo assets**. Les groupes de concurrence sont séparés par `event_name` pour qu’un `workflow_dispatch` manuel n’annule pas un push en cours.
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

Local : `npm run test:e2e:playwright` (smoke) · `npm run test:e2e:demo` (GIF, ffmpeg requis).

## Demo assets (`demo-assets.yml`)

1. Même stack que Playwright (Postgres + backend + Nuxt preview).
2. Tests `e2e/tests/demo/*.demo.ts` en **desktop** et **mobile** (vidéo `on`).
3. `ffmpeg` → GIF dans `assets/demo/{desktop,mobile}/`.
4. **PR** (code) : tests + artefact `demo-gifs` ; `paths-ignore: assets/demo/**` (pas de boucle).
5. **`main`** : Playwright → **PR `bot/demo-gifs`** → auto-merge (pas de `git push` direct : la ruleset CodeQL bloque le bot, contrairement à **Pages** (`deploy-pages`) et au **wiki** (dépôt `.wiki.git` séparé)).

Guide : [`docs/USAGE.md`](../docs/USAGE.md).

## Docs (`docs.yml`)

Indépendant de la CI : génération longue (OpenRouter), build VitePress, déploiement Pages. Secret `OPENROUTER_API_KEY` requis sauf `workflow_dispatch` avec `skip_ai: true`.

## CodeQL (`codeql.yml`)

Toujours sur les PR (ruleset dépôt), même si seuls des fichiers markdown changent.
