# Workflows GitHub Actions

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| [**CI**](ci.yml) | PR + push `main` / `develop` | Lint, tests, coverage, Codecov, wiki (main) |
| [**Docs**](docs.yml) | Push `main`, `workflow_dispatch` | Génération doc IA + VitePress → GitHub Pages |
| [**CodeQL**](codeql.yml) | PR + push (chemins code) | Analyse sécurité statique |

## CI (`ci.yml`)

```
backend ──┐
frontend ─┼──► report (Codecov + wiki sur main)
scripts ──┘
```

1. **backend** — Postgres service, Prisma, lint, Jest unit + e2e (`--silent` pour limiter le bruit des filtres testés).
2. **frontend** — `nuxt prepare`, lint, Vitest coverage.
3. **scripts** — Vitest du pipeline `scripts/docs`.
4. **report** — Télécharge les artefacts, fusionne les `coverage-summary.json`, publie Codecov et (sur `main` uniquement) le wiki.

Les tests ne sont **pas** exécutés deux fois : l’ancien workflow `wiki-coverage.yml` a été fusionné dans le job `report`.

## Docs (`docs.yml`)

Indépendant de la CI : génération longue (OpenRouter), build VitePress, déploiement Pages. Secret `OPENROUTER_API_KEY` requis sauf `workflow_dispatch` avec `skip_ai: true`.

## CodeQL (`codeql.yml`)

Toujours sur les PR (ruleset dépôt), même si seuls des fichiers markdown changent.
