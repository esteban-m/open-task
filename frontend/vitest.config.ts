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
        'components/**/*.vue',
        'composables/**/*.ts',
        'config/**/*.ts',
        'stores/**/*.ts',
        'utils/**/*.ts',
        'middleware/**/*.ts',
        'middleware/**/*.ts',
        'plugins/**/*.ts',
      ],
      exclude: ['**/*.d.ts', 'tests/**', '.nuxt/**', '.output/**'],
      all: true,
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
})
