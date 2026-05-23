import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Open-Task',
      meta: [{ charset: 'utf-8', name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/hero.svg' }]
    }
  },

  css: ['~/assets/main.css'],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
      wsBase: process.env.NUXT_PUBLIC_WS_BASE_URL || 'http://localhost:4000',
    },
  },

  devtools: { enabled: false },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  modules: [
    '@nuxt/test-utils/module',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    ...(process.env.NUXT_STORYBOOK !== '0' ? ['@nuxtjs/storybook'] as const : []),
  ],

  // components/ui/AppLogo.vue → <AppLogo /> (sans préfixe Ui)
  components: [{ path: '~/components/ui', pathPrefix: false }],

  // Auth via localStorage + cookie : pas de SSR sur les pages app pour éviter les mismatches d'hydratation
  routeRules: {
    '/': { ssr: false },
    '/login': { ssr: false },
    '/register': { ssr: false },
  },

  compatibilityDate: '2026-05-15',

  ...(process.env.NUXT_STORYBOOK !== '0'
    ? {
        storybook: {
          enabled: true,
        },
      }
    : {}),
})