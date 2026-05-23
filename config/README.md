# Configuration dépôt

Fichiers JSON partagés (même principe que `scripts/docs/config/open-task.docs.json`).

| Fichier | Consommateurs | Rôle |
|---------|---------------|------|
| [`open-task.e2e.json`](open-task.e2e.json) | `e2e/`, `scripts/ci/`, tests backend e2e | Stack Playwright, démos GIF, utilisateur test |

Chargeur unique : [`load-e2e.mjs`](load-e2e.mjs) (`loadE2eConfig()`).

Variables d’environnement optionnelles (surcharge) : `BACKEND_PORT`, `FRONTEND_PORT`, `PLAYWRIGHT_BASE_URL`, `DEMO_GIF_FPS`, `DEMO_STEP_PAUSE_MS`, etc.
