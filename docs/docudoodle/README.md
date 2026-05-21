# Génération de documentation

La doc n'est **pas** générée fichier par fichier. Le manifeste `scripts/docs/doc-structure.mjs` définit des chapitres cohérents (Diátaxis).

- **Stable (git)** : `docs/guide/`, `docs/reference/`, `docs/operations/`
- **IA (CI)** : `docs/generated/` — un appel OpenRouter par chapitre métier
- **Extraction** : API REST, ERD Prisma, architecture

Voir [Docudoodle](https://github.com/genericmilk/docudoodle) pour l'inspiration doc-as-code ; ce projet utilise un pipeline TypeScript adapté à NestJS/Nuxt.
