import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
global.import = {
  meta: {
    env: {
      VITE_URL: 'http://localhost:1337'
    }
  }
};

// $env/dynamic/public needs a running SvelteKit; in tests every public switch reads as off
// (a test that wants one on mocks the module that reads it, e.g. $lib/sheirut/pricingTracksFlag).
vi.mock('$env/dynamic/public', () => ({ env: {} }));

// Mock document.cookie for authentication tests
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'jwt=test-token; id=test-user-id'
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();