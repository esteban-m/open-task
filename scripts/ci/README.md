# Scripts CI (`open-task-ci-scripts`)

Outils Node pour la pipeline GitHub Actions (couverture, wiki, GIF démo).

Configuration E2E : [`config/open-task.e2e.json`](../config/open-task.e2e.json) chargée par [`src/core/load-e2e.mjs`](src/core/load-e2e.mjs) (réexport `e2e-config.mjs`).

## Structure

```
scripts/ci/
  cli.mjs                 # Point d’entrée
  run-playwright-stack.sh # Stack Postgres + Nest + Nuxt + Playwright (--all-projects, --gifs)
  src/
    core/load-e2e.mjs     # lit config/open-task.e2e.json
    core/e2e-config.mjs # réexport public
    core/paths.mjs
    reports/              # merge, assert e2e, markdown, wiki
    playwright/           # slugs démo, vidéos → GIF
  tests/
  package.json
```

## Commandes

```bash
cd scripts/ci && npm ci

node cli.mjs stack-env                    # export shell (ports, DATABASE_URL, JWT…)
node cli.mjs merge-coverage -o out.json a.json b.json
node cli.mjs assert-e2e backend/coverage-e2e/coverage-summary.json
node cli.mjs coverage-markdown --summary path.json --out-dir wiki-fragments --prefix backend
node cli.mjs wiki-pages --out-dir wiki-out --sha SHA --run-url URL --package slug:…
node cli.mjs gifs                         # chemins depuis open-task.e2e.json
```

Depuis la racine : `npm run test:e2e:playwright` / `test:e2e:demo` appellent `run-playwright-stack.sh` (qui charge `stack-env`).

## Tests

```bash
npm test
npm run test:coverage
```
