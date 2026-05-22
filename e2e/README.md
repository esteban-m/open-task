# E2E full-stack (Playwright)

Tests navigateur contre le **vrai** backend (`nest build` + `node dist/main`) et le frontend (`nuxt preview`).

```bash
# Depuis la racine (démarre Postgres test + stack + Playwright)
npm run test:e2e:playwright

# Postgres déjà disponible (ex. CI)
npm run test:e2e:playwright:ci
```

Variables utiles : `PLAYWRIGHT_BASE_URL`, `DATABASE_URL`, `BACKEND_PORT`, `FRONTEND_PORT`.
