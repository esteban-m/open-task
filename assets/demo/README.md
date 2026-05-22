# Démos visuelles (GIF)

GIF générés par la CI ([`demo-assets.yml`](../../.github/workflows/demo-assets.yml)) :

- **PR** : tests + artefact **demo-gifs** (pas de commit sur la branche → merge possible).
- **`main`** (après merge) : commit automatique dans `assets/demo/`.

| Dossier | Viewport |
|---------|----------|
| `desktop/` | Chrome ~1280px |
| `mobile/` | Pixel 5 |

Scénarios : `01-inscription` … `09-partage-liste` (voir [`docs/USAGE.md`](../../docs/USAGE.md)). Le `05-mobile-navigation` ne tourne que sur **mobile** ; les autres sur desktop + mobile.

Pour régénérer en local :

```bash
PLAYWRIGHT_DEMO=1 npm run test:e2e:playwright
# ou après un run demo seul :
node scripts/ci/playwright-videos-to-gifs.mjs
```

Pauses pour GIF lisibles : `slowMo` Playwright + `DEMO_STEP_PAUSE_MS` (500) / `DEMO_SCENE_PAUSE_MS` (1500) entre les étapes.
