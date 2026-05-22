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
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'app.vue',
        'pages/**/*.vue',
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
