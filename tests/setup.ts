import { beforeEach } from 'vitest'
import { config } from 'dotenv'
import path from 'path'

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') })

// Reset the rate limiter before each test
beforeEach(() => {
  if ((globalThis as any).rateLimitMap) {
    (globalThis as any).rateLimitMap.clear()
  }
})
