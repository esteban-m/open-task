# E2E full-stack (Playwright)

Tests navigateur contre le **vrai** backend (`nest build` + `node dist/main`) et le frontend (`nuxt preview`).

Configuration centralisée : [`config/open-task.e2e.json`](../config/open-task.e2e.json) (ports, timeouts, démos GIF, utilisateur test). Chargée via [`config/load-e2e.mjs`](../config/load-e2e.mjs) dans `playwright.config.ts` et `helpers/`.

```bash
# Smoke CI (rapide)
npm run test:e2e:playwright

# Démos + GIF dans docs/public/demo/ (nécessite ffmpeg)
npm run test:e2e:demo
```

| Mode | Commande | Sortie |
|------|----------|--------|
| Smoke | `npm run test:e2e:playwright` | tests `tests/smoke/` |
| Démo | `PLAYWRIGHT_DEMO=1` ou `npm run test:e2e:demo` | `docs/public/demo/{desktop,mobile}/*.gif` |

Variables utiles (surcharge la config) : `PLAYWRIGHT_BASE_URL`, `DATABASE_URL`, `BACKEND_PORT`, `FRONTEND_PORT`, `DEMO_STEP_PAUSE_MS`, `DEMO_GIF_FPS`.
