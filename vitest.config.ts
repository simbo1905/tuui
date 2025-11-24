import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
    coverage: {
      enabled: false
    }
  }
})
