# Génération de documentation

La doc n'est **pas** générée fichier par fichier. Le manifeste `config/open-task.docs.json` définit des chapitres cohérents (Diátaxis).

- **Stable (git)** : `docs/guide/`, `docs/reference/`, `docs/operations/`
- **IA (CI)** : `docs/generated/` — un appel Mistral par chapitre métier
- **Extraction** : API REST, ERD Prisma, architecture

Voir [Docudoodle](https://github.com/genericmilk/docudoodle) pour l'inspiration doc-as-code ; ce projet utilise un pipeline TypeScript adapté à NestJS/Nuxt.
