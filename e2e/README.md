# E2E full-stack (Playwright)

Tests navigateur contre le **vrai** backend (`nest build` + `node dist/main`) et le frontend (`nuxt preview`).

```bash
# Smoke CI (rapide)
npm run test:e2e:playwright

# Démos + GIF dans assets/demo/ (nécessite ffmpeg)
npm run test:e2e:demo
```

| Mode | Commande | Sortie |
|------|----------|--------|
| Smoke | `npm run test:e2e:playwright` | tests `tests/smoke/` |
| Démo | `PLAYWRIGHT_DEMO=1` ou `npm run test:e2e:demo` | `assets/demo/{desktop,mobile}/*.gif` |

Variables utiles : `PLAYWRIGHT_BASE_URL`, `DATABASE_URL`, `BACKEND_PORT`, `FRONTEND_PORT`.
