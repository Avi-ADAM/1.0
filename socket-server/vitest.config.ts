import { defineConfig } from 'vitest/config';

// Without a config of its own, vitest walks up to 1.0main/vitest.config.js and
// loads the SvelteKit plugin and its test projects, which this plain Node
// server cannot run under (DataCloneError, "no tests").
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
