# Démos visuelles (GIF)

Les GIF ne sont **pas** versionnés dans Git. Ils sont générés par Playwright en CI et publiés sur **GitHub Pages** :

`https://esteban-m.github.io/open-task/demo/{desktop|mobile}/<slug>.gif`

| Dossier | Viewport |
|---------|----------|
| `desktop/` | Chrome ~1280px |
| `mobile/` | Pixel 5 |

Scénarios : `01-inscription` … `09-partage-liste` (voir [`docs/USAGE.md`](../../USAGE.md)).

**Local** (ffmpeg requis) :

```bash
npm run test:e2e:demo
# sortie : docs/public/demo/
```

**CI** : workflow **Docs** (`push main`) — pas de commit sur `main`, pas de ruleset CodeQL.
