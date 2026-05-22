# Démos visuelles (GIF)

GIF générés automatiquement par la CI ([`.github/workflows/demo-assets.yml`](../../.github/workflows/demo-assets.yml)) à partir des enregistrements Playwright.

| Dossier | Viewport |
|---------|----------|
| `desktop/` | Chrome ~1280px |
| `mobile/` | Pixel 5 |

Scénarios : `01-inscription` … `05-mobile-navigation` (voir [`docs/USAGE.md`](../../docs/USAGE.md)).

Pour régénérer en local :

```bash
PLAYWRIGHT_DEMO=1 npm run test:e2e:playwright
# ou après un run demo seul :
node scripts/ci/playwright-videos-to-gifs.mjs
```
