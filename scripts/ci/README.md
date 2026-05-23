# Scripts CI (`open-task-ci-scripts`)

Outils Node pour la pipeline GitHub Actions (couverture, wiki, GIF démo).

## Structure

```
scripts/ci/
  cli.mjs                 # Point d’entrée
  run-playwright-stack.sh # Stack Postgres + Nest + Nuxt + Playwright
  src/
    core/paths.mjs
    reports/             # merge, assert e2e, markdown, wiki
    playwright/           # slugs démo, vidéos → GIF
  tests/
  package.json
```

## Commandes

```bash
cd scripts/ci && npm ci

node cli.mjs merge-coverage -o out.json a.json b.json
node cli.mjs assert-e2e backend/coverage-e2e/coverage-summary.json
node cli.mjs coverage-markdown --summary path.json --out-dir wiki-fragments --prefix backend
node cli.mjs wiki-pages --out-dir wiki-out --sha SHA --run-url URL --package slug:…
node cli.mjs gifs [e2e/test-results] [docs/public/demo]
```

Depuis la racine : `npm run test:e2e:playwright` / `test:e2e:demo` appellent `run-playwright-stack.sh`.

## Tests

```bash
npm test
npm run test:coverage
```
