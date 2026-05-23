# Workflows GitHub Actions

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| [**CI**](ci.yml) | PR + push `main` / `develop`, `workflow_dispatch` | Lint, tests, coverage, Codecov, wiki (main) |
| [**Docs**](docs.yml) | Push `main`, `workflow_dispatch` | Playwright → GIF → portail Pages (docs + Storybook + Swagger) |
| [**Demo assets**](demo-assets.yml) | PR, `workflow_dispatch` | Valide les démos Playwright + artefact (pas de push `main`) |
| [**CodeQL**](codeql.yml) | PR + push (chemins code) | Analyse sécurité statique |

**Push `main`** : **CI**, **CodeQL** (si chemins code), **Docs** (GIF + site). Plus de second push bot pour les GIF — fini les `paths-ignore` et la ruleset CodeQL sur `assets/demo`.

## CI (`ci.yml`)

```
backend ────────┐
frontend ───────┼──► report (Codecov + wiki sur main)
scripts ────────┘
e2e-playwright ───► Playwright (backend build + preview Nuxt + navigateur)
```

1. **backend** — Service Postgres (port 5432), Prisma migrate, tests unitaires puis **e2e avec `DATABASE_URL`** (sinon les tests e2e passent mais la couverture e2e reste à 0 %). Vérification via `scripts/ci/cli.mjs assert-e2e`.
2. **frontend** — `nuxt prepare`, lint, Vitest coverage.
3. **scripts** — Vitest `scripts/docs` + `scripts/ci` (pipeline doc + outils CI).
4. **e2e-playwright** — Postgres, `nest build` + serveur backend, `nuxt build` + preview, scénario UI (inscription → liste → tâche → logout/login). Script : `scripts/ci/run-playwright-stack.sh`.
5. **report** — Télécharge les artefacts, fusionne les `coverage-summary.json`, publie Codecov et (sur `main` uniquement) le wiki.

Backend e2e (Jest) : `test/app-*.e2e-spec.ts` — auth (refresh, logout, `/me`), API (update, partage, révocation), flux existants. Garde-fou : `scripts/ci/cli.mjs assert-e2e` (≥ 55 % lignes e2e).

Local : `npm run test:e2e:playwright` (smoke) · `npm run test:e2e:demo` (GIF, ffmpeg requis).

## Demo assets (`demo-assets.yml`)

1. Même stack que Playwright (Postgres + backend + Nuxt preview).
2. Tests `e2e/tests/demo/*.demo.ts` en **desktop** et **mobile**.
3. **PR uniquement** : validation + artefact `demo-gifs` (pas de commit sur `main`).

Les GIF publiés en production passent par **Docs** → GitHub Pages (`https://<user>.github.io/open-task/demo/…`).

Guide : [`USAGE.md`](../USAGE.md).

## Docs (`docs.yml`)

1. **demo-gifs** — Playwright → `docs/public/demo/` (artefact).
2. **generate-docs** — génération IA (Mistral), build VitePress (`/docs/`), export OpenAPI, build Storybook (`/storybook/`), assemblage portail (`docs-site/`).
3. **deploy-pages** — déploiement (API Pages, **aucun push Git**).

Structure GitHub Pages :

| Chemin | Contenu |
|--------|---------|
| `/` | Portail (accueil) |
| `/docs/` | Documentation VitePress |
| `/storybook/` | Composants UI (Storybook) |
| `/swagger/` | API OpenAPI interactive |
| `/demo/` | GIF Playwright |

Secret `MISTRAL_API_KEY` requis sauf `workflow_dispatch` avec `skip_ai: true`.

## CodeQL (`codeql.yml`)

Toujours sur les PR (ruleset dépôt), même si seuls des fichiers markdown changent.

## Branche `main`

Ruleset **Protect main — PR obligatoire + CodeQL** (voir [.github/rulesets/protect-main.json](../rulesets/protect-main.json)) :

- PR obligatoire avant merge (pas de push direct sur `main`)
- **Merge classique par défaut** (`gh pr merge --merge`) — pas de squash sauf demande explicite
- Pas de force-push (`non_fast_forward`)
- CodeQL requis
- **Aucun bypass** (les GIF / Pages ne passent plus par un commit bot sur `main`)
