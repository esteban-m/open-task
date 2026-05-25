# E2E full-stack (Playwright)

Tests navigateur contre le **vrai** backend (`nest build` + `node dist/main`) et le frontend (`nuxt preview`).

Configuration : [`config/open-task.e2e.json`](../config/open-task.e2e.json) — chargée par [`scripts/ci/src/core/e2e-config.mjs`](../scripts/ci/src/core/e2e-config.mjs) (`playwright.config.ts`, `helpers/`).

```bash
# Smoke (local / rapide)
npm run test:e2e:playwright

# Démos + GIF dans docs/public/demo/ (nécessite ffmpeg)
npm run test:e2e:demo

# Comme la CI (smoke + démo, sans GIF)
bash scripts/ci/run-playwright-stack.sh --skip-docker --all-projects
```

| Mode | Commande | Sortie |
|------|----------|--------|
| Smoke | `npm run test:e2e:playwright` | tests `tests/smoke/` |
| CI (PR / develop) | `--all-projects` dans `run-playwright-stack.sh` | smoke + démo, pas de GIF |
| CI (main) | `--all-projects --gifs` | + `docs/public/demo/*.gif` |
| Démo locale | `npm run test:e2e:demo` | démo + GIF |

Variables utiles (surcharge la config) : `PLAYWRIGHT_BASE_URL`, `DATABASE_URL`, `BACKEND_PORT`, `FRONTEND_PORT`, `DEMO_STEP_PAUSE_MS`, `DEMO_GIF_FPS`.
