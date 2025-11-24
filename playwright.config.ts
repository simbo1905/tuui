import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/specs',
  outputDir: 'tests/results',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,
  expect: {
    timeout: 10000
  }
})
