import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: process.env.CI ? 100_000 : 50_000,
    globalSetup: 'vitest-global.ts',
    include: ['test/*.test.ts', 'src/**/*.test.ts'],
  },
})
