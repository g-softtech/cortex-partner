import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    include: ['tests/integration/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    env: {
      // Force Vitest to use the test environment variables explicitly
      NODE_ENV: 'test'
    }
  }
})
