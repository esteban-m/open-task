# Histoire (catalogue composants)

Config : `../histoire.config.ts`, stories `**/*.story.vue`, snippets `source.ts`.

## Pourquoi pas `@histoire/plugin-nuxt` ?

Le [plugin officiel Nuxt](https://github.com/histoire-dev/histoire/tree/main/packages/histoire-plugin-nuxt) est la cible (auto-imports, `useState`, Pinia, etc.). Avec **Nuxt 3.21**, `histoire build` échoue encore en collecte :

```text
ERR_PACKAGE_IMPORT_NOT_DEFINED: "#build/nuxt.config.mjs"
```

Dès que Histoire/Nuxt corrige ce point, on pourra remplacer la config Vite + `histoire/mocks/nuxt-app.ts` par `HstNuxt()` seul.

En attendant, les mocks fournissent `useNuxtApp`, `useRuntimeConfig`, `$fetch` et `useState` pour les composables (ex. `useTheme` → `ThemePicker`).
