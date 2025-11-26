/**
 * Integration tests for Action API endpoint - Core functionality
 * 
 * Tests the essential request handling, authentication, and error responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';
import { registerAction } from '$lib/server/actions/registry.js';
import type { ActionConfig } from '$lib/server/actions/types.js';

// Mock environment variables
vi.stubEnv('VITE_URL', 'http://localhost:1337');
vi.stubEnv('VITE_ADMINMONTHER', 'test-admin-token');

describe('Action API Endpoint - Core Functionality', () => {
  beforeEach(async () => {
    // Clear any registered actions before each test
    const { actionRegistry } = await import('$lib/server/actions/registry.js');
    actionRegistry.clear();
  });
  
  describe('Request Structure Validation', () => {
    it('should reject requests without actionKey', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: {} })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          if (name === 'lang') return 'he';
          return undefined;
        })
      };
      
      const fetch = global.fetch;
      
      try {
        await POST({ request, cookies, fetch } as any);
        expect.fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.status).toBe(400);
        expect(e.body.message).toContain('actionKey');
      }
    });
    
    it('should reject requests without params', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey: 'testAction' })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          if (name === 'lang') return 'he';
          return undefined;
        })
      };
      
      const fetch = global.fetch;
      
      try {
        await POST({ request, cookies, fetch } as any);
        expect.fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.status).toBe(400);
        expect(e.body.message).toContain('params');
      }
    });
  });
  
  describe('Authentication', () => {
    it('should reject requests without user ID', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'testAction',
          params: {}
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'jwt') return 'valid-jwt-token';
          return undefined; // No user ID
        })
      };
      
      const fetch = global.fetch;
      
      try {
        await POST({ request, cookies, fetch } as any);
        expect.fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.status).toBe(401);
        expect(e.body.message).toContain('Authentication required');
      }
    });
    
    it('should reject requests without JWT', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'testAction',
          params: {}
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          return undefined; // No JWT
        })
      };
      
      const fetch = global.fetch;
      
      try {
        await POST({ request, cookies, fetch } as any);
        expect.fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.status).toBe(401);
        expect(e.body.message).toContain('Authentication required');
      }
    });
    
    it('should extract user context from cookies', async () => {
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user456';
          if (name === 'jwt') return 'jwt-token-456';
          if (name === 'lang') return 'en';
          return undefined;
        })
      };
      
      // Verify cookies are accessed
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'unknownAction',
          params: {}
        })
      });
      
      try {
        await POST({ request, cookies, fetch: vi.fn() } as any);
      } catch (e) {
        // Expected to fail with unknown action
      }
      
      // Verify cookies were accessed
      expect(cookies.get).toHaveBeenCalledWith('id');
      expect(cookies.get).toHaveBeenCalledWith('jwt');
      expect(cookies.get).toHaveBeenCalledWith('lang');
    });
    
    it('should default to Hebrew language if not specified', async () => {
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user789';
          if (name === 'jwt') return 'jwt-token-789';
          // No lang cookie
          return undefined;
        })
      };
      
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'unknownAction',
          params: {}
        })
      });
      
      try {
        await POST({ request, cookies, fetch: vi.fn() } as any);
      } catch (e) {
        // Expected to fail with unknown action
      }
      
      // Verify lang cookie was checked
      expect(cookies.get).toHaveBeenCalledWith('lang');
    });
  });
  
  describe('Action Validation', () => {
    it('should return 404 for unknown action', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'unknownAction',
          params: {}
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          if (name === 'lang') return 'he';
          return undefined;
        })
      };
      
      const mockFetch = vi.fn();
      
      const response = await POST({
        request,
        cookies,
        fetch: mockFetch
      } as any);
      
      const result = await response.json();
      
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ACTION');
      expect(result.error?.message).toContain('unknownAction');
    });
    
    it('should return 400 for validation errors', async () => {
      // Register a test action with required parameters
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true }
        },
        authRules: [{ type: 'jwt' }]
      };
      
      registerAction(testAction);
      
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'testAction',
          params: { name: 'Test' } // Missing 'age'
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          if (name === 'lang') return 'he';
          return undefined;
        })
      };
      
      const mockFetch = vi.fn();
      
      const response = await POST({
        request,
        cookies,
        fetch: mockFetch
      } as any);
      
      const result = await response.json();
      
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details).toContain('Missing required parameter: age');
      expect(mockFetch).not.toHaveBeenCalled(); // Should not reach Strapi
    });
  });
  
  describe('Response Format', () => {
    it('should return standardized error response', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'unknownAction',
          params: {}
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          return undefined;
        })
      };
      
      const response = await POST({
        request,
        cookies,
        fetch: vi.fn()
      } as any);
      
      const result = await response.json();
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
    });
  });
  
  describe('Error Status Code Mapping', () => {
    it('should map VALIDATION_FAILED to 400', async () => {
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          required: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }]
      };
      
      registerAction(testAction);
      
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'testAction',
          params: {} // Missing required param
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          return undefined;
        })
      };
      
      const response = await POST({
        request,
        cookies,
        fetch: vi.fn()
      } as any);
      
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error?.code).toBe('VALIDATION_FAILED');
    });
    
    it('should map UNKNOWN_ACTION to 404', async () => {
      const request = new Request('http://localhost/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'nonExistentAction',
          params: {}
        })
      });
      
      const cookies = {
        get: vi.fn((name: string) => {
          if (name === 'id') return 'user123';
          if (name === 'jwt') return 'valid-jwt-token';
          return undefined;
        })
      };
      
      const response = await POST({
        request,
        cookies,
        fetch: vi.fn()
      } as any);
      
      expect(response.status).toBe(404);
      
      const result = await response.json();
      expect(result.error?.code).toBe('UNKNOWN_ACTION');
    });
  });
});
