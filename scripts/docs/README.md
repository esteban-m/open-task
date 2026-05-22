# Pipeline documentation (doc-as-code)

Structure **config + services + generators** :

```
scripts/docs/
├── config/open-task.docs.json   # manifeste repo (navigation, chapitres, prompts, diagrammes)
├── src/
│   ├── core/                    # chargement config, chemins
│   ├── services/                # OpenRouter, GitHub, Prisma ERD, liens, Mermaid…
│   ├── generators/              # database, api-reference, architecture, chapters, assemble
│   └── pipeline.mjs             # orchestration
└── cli.mjs                      # point d'entrée
```

## Commandes

```bash
cd scripts/docs
npm run generate    # pipeline complet (CI)
npm run assemble    # sidebar + liens + diagrammes (prebuild VitePress)
```

## Configuration

Tout ce qui est spécifique au dépôt vit dans [`config/open-task.docs.json`](config/open-task.docs.json) :

- catégories Diátaxis et pages statiques
- chapitres IA (sources, plan `##`)
- injections Mermaid (auth, temps réel)
- réécritures de liens (`linkRewrites`)
- prompts OpenRouter

Secret CI : `OPENROUTER_API_KEY`.
