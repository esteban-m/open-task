# Configuration dépôt (JSON uniquement)

Manifestes partagés — **pas de code ici**. Les chargeurs vivent dans les paquets scripts :

| Fichier | Chargeur | Consommateurs |
|---------|----------|---------------|
| [`open-task.e2e.json`](open-task.e2e.json) | [`scripts/ci/src/core/load-e2e.mjs`](../scripts/ci/src/core/load-e2e.mjs) | `e2e/`, `scripts/ci/`, tests backend e2e |
| [`open-task.docs.json`](open-task.docs.json) | [`scripts/docs/src/core/config.mjs`](../scripts/docs/src/core/config.mjs) | pipeline doc-as-code |

Variables d’environnement (surcharge E2E) : `BACKEND_PORT`, `FRONTEND_PORT`, `PLAYWRIGHT_BASE_URL`, `DEMO_GIF_FPS`, `DEMO_STEP_PAUSE_MS`, etc.
