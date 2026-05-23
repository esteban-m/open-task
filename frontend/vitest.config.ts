import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['tests/**/*.test.ts'],
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true,
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'app.vue',
        // pages/*.vue : logique couverte par tests/pages-smoke + e2e Playwright (SFC non instrumentés par v8)
        'components/**/*.vue',
        'composables/**/*.ts',
        'config/**/*.ts',
        'stores/**/*.ts',
        'utils/**/*.ts',
        'middleware/**/*.ts',
        'plugins/**/*.ts',
      ],
      exclude: ['**/*.d.ts', 'tests/**', '.nuxt/**', '.output/**'],
      all: true,
    },
  },
})
