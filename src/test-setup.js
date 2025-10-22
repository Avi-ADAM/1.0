import '@testing-library/jest-dom';

// Mock environment variables
global.import = {
  meta: {
    env: {
      VITE_URL: 'http://localhost:1337'
    }
  }
};

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