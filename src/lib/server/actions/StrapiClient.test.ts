/**
 * StrapiClient Unit Tests
 * 
 * Tests for the Strapi GraphQL client including:
 * - Basic query execution
 * - Error handling
 * - Retry logic with exponential backoff
 * - Connection pooling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrapiClient, StrapiError } from './StrapiClient';

// Mock the qids module
vi.mock('../../../routes/api/send/qids.js', () => ({
  qids: {
    'testQuery': 'query TestQuery($id: ID!) { user(id: $id) { id name } }',
    'testMutation': 'mutation TestMutation($input: UserInput!) { createUser(input: $input) { id } }'
  }
}));

describe('StrapiClient', () => {
  let client: StrapiClient;
  let fetchMock: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    // Create a fresh client for each test
    client = new StrapiClient('https://test-api.example.com', 'test-admin-token');
    
    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });
  
  afterEach(() => {
    // Clean up
    client.destroy();
    vi.clearAllMocks();
  });
  
  describe('Basic Execution', () => {
    it('should execute a query successfully', async () => {
      // Mock successful response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { user: { id: '1', name: 'Test User' } }
        })
      });
      
      const result = await client.execute('testQuery', { id: '1' });
      
      expect(result.data.user.id).toBe('1');
      expect(result.data.user.name).toBe('Test User');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    
    it('should use admin token when no user JWT provided', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });
      
      await client.execute('testQuery', { id: '1' });
      
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe('bearer test-admin-token');
    });
    
    it('should use user JWT when provided', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });
      
      await client.execute('testQuery', { id: '1' }, 'user-jwt-token');
      
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe('bearer user-jwt-token');
    });
    
    it('should send correct GraphQL request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });
      
      await client.execute('testQuery', { id: '123' });
      
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.query).toContain('query TestQuery');
      expect(body.variables).toEqual({ id: '123' });
    });
  });
  
  describe('Error Handling', () => {
    it('should throw StrapiError for unknown query ID', async () => {
      await expect(
        client.execute('unknownQuery', {})
      ).rejects.toThrow(StrapiError);
      
      try {
        await client.execute('unknownQuery', {});
      } catch (error) {
        expect(error).toBeInstanceOf(StrapiError);
        expect((error as StrapiError).getCode()).toBe('QUERY_NOT_FOUND');
      }
    });
    
    it('should throw StrapiError for HTTP errors', async () => {
      // Mock all retry attempts to return 500
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      try {
        await client.execute('testQuery', { id: '1' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(StrapiError);
        expect((error as StrapiError).getCode()).toBe('HTTP_ERROR');
        expect((error as StrapiError).message).toContain('500');
      }
    });
    
    it('should throw StrapiError for GraphQL errors', async () => {
      // GraphQL errors should not be retried, so mockResolvedValueOnce is fine
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [
            { message: 'User not found', extensions: { code: 'NOT_FOUND' } }
          ]
        })
      });
      
      try {
        await client.execute('testQuery', { id: '1' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(StrapiError);
        expect((error as StrapiError).message).toBe('User not found');
        expect((error as StrapiError).getCode()).toBe('NOT_FOUND');
      }
    });
    
    it('should wrap network errors in StrapiError', async () => {
      // Mock all retry attempts to fail with network error
      fetchMock.mockRejectedValue(new Error('Network timeout'));
      
      try {
        await client.execute('testQuery', { id: '1' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(StrapiError);
        expect((error as StrapiError).getCode()).toBe('NETWORK_ERROR');
        expect((error as StrapiError).message).toContain('Network timeout');
      }
    });
  });
  
  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      // First two attempts fail, third succeeds
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } })
        });
      
      const result = await client.execute('testQuery', { id: '1' });
      
      expect(result.data.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    
    it('should retry on 5xx HTTP errors', async () => {
      // First attempt fails with 500, second succeeds
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } })
        });
      
      const result = await client.execute('testQuery', { id: '1' });
      
      expect(result.data.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    
    it('should not retry on 4xx HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(
        client.execute('testQuery', { id: '1' })
      ).rejects.toThrow(StrapiError);
      
      // Should only try once (no retries for 4xx)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    
    it('should not retry on GraphQL errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Validation error' }]
        })
      });
      
      await expect(
        client.execute('testQuery', { id: '1' })
      ).rejects.toThrow(StrapiError);
      
      // Should only try once (no retries for GraphQL errors)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    
    it('should respect max retries', async () => {
      // Create client with custom retry config
      const customClient = new StrapiClient(
        'https://test-api.example.com',
        'test-token',
        { maxRetries: 2 }
      );
      
      // All attempts fail
      fetchMock.mockRejectedValue(new Error('Network error'));
      
      await expect(
        customClient.execute('testQuery', { id: '1' })
      ).rejects.toThrow(StrapiError);
      
      // Should try 3 times total (initial + 2 retries)
      expect(fetchMock).toHaveBeenCalledTimes(3);
      
      customClient.destroy();
    });
    
    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      // Mock setTimeout to capture delays
      global.setTimeout = ((callback: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      }) as any;
      
      // All attempts fail
      fetchMock.mockRejectedValue(new Error('Network error'));
      
      try {
        await client.execute('testQuery', { id: '1' });
      } catch (error) {
        // Expected to fail
      }
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      
      // Check that delays increase exponentially
      expect(delays.length).toBeGreaterThan(0);
      if (delays.length >= 2) {
        expect(delays[1]).toBeGreaterThan(delays[0]);
      }
    });
  });
  
  describe('Connection Pooling', () => {
    it('should create connection pool on initialization', () => {
      const newClient = new StrapiClient();
      expect(newClient).toBeDefined();
      newClient.destroy();
    });
    
    it('should destroy connection pool', () => {
      const newClient = new StrapiClient();
      expect(() => newClient.destroy()).not.toThrow();
    });
  });
  
  describe('StrapiError', () => {
    it('should provide error code', () => {
      const error = new StrapiError([
        { message: 'Test error', extensions: { code: 'TEST_CODE' } }
      ]);
      
      expect(error.getCode()).toBe('TEST_CODE');
    });
    
    it('should provide all error messages', () => {
      const error = new StrapiError([
        { message: 'Error 1' },
        { message: 'Error 2' },
        { message: 'Error 3' }
      ]);
      
      const messages = error.getMessages();
      expect(messages).toHaveLength(3);
      expect(messages).toContain('Error 1');
      expect(messages).toContain('Error 2');
      expect(messages).toContain('Error 3');
    });
    
    it('should have correct error name', () => {
      const error = new StrapiError([{ message: 'Test' }]);
      expect(error.name).toBe('StrapiError');
    });
  });
});
