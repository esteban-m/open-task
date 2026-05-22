# Démos visuelles (GIF)

GIF générés par la CI ([`demo-assets.yml`](../../.github/workflows/demo-assets.yml)) sur chaque **PR vers `main`** et sur **`main`** (artefact **demo-gifs** si le commit auto est désactivé, ex. PR depuis un fork).

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
