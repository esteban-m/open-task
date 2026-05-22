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
        'components/**/*.vue',
        'composables/**/*.ts',
        'config/**/*.ts',
        'stores/**/*.ts',
        'utils/**/*.ts',
        'middleware/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        'tests/**',
        '.nuxt/**',
        '.output/**',
        'pages/**',
        'plugins/**',
      ],
      all: true,
    },
  },
})
