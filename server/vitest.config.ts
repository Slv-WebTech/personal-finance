import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // All integration test files share one physical `personal-finance-test`
    // MongoDB database (see vitest.setup.ts) and reuse the same hardcoded
    // fixture emails/data — running files concurrently (Vitest's default)
    // lets one file's beforeEach wipe collections out from under another
    // file's in-flight test, and lets two files race to register the same
    // email. Sequential file execution avoids this without needing per-file
    // database isolation or unique-per-file fixture data.
    fileParallelism: false,
  },
})
