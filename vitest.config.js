import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/routes/**/*.test.js'], // Exclude route tests to avoid SvelteKit conflicts
    environment: 'happy-dom', // Use happy-dom instead of jsdom
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    // Property-based testing configuration
    testTimeout: 10000 // Increase timeout for property-based tests
  }
});