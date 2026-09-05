import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

/**
 * Two projects, because component rendering and server code want opposite
 * module resolution.
 *
 * `render()` needs Svelte's *client* build, which means putting the `browser`
 * condition ahead of `node`. Doing that globally is not an option: it also
 * swaps the node builds out from under `shadowSign` and the space e2e tests,
 * which then fail on missing node crypto. So the browser condition is scoped to
 * files named `*.svelte.test.ts`, and everything else resolves exactly as before.
 */
const shared = {
  environment: 'happy-dom', // Use happy-dom instead of jsdom
  setupFiles: ['./src/test-setup.js'],
  globals: true,
  // Property-based testing configuration
  testTimeout: 10000 // Increase timeout for property-based tests
};

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [sveltekit()],
        test: {
          ...shared,
          name: 'unit',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: [
            'src/routes/**/*.test.js', // Exclude route tests to avoid SvelteKit conflicts
            'src/**/*.svelte.test.ts' // Component renders — see the `components` project
          ]
        }
      },
      {
        plugins: [sveltekit(), svelteTesting()],
        resolve: { conditions: ['browser'] },
        test: {
          ...shared,
          name: 'components',
          include: ['src/**/*.svelte.test.ts']
        }
      }
    ]
  }
});
