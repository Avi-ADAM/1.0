/**
 * Strapi Client
 * 
 * Wrapper for GraphQL operations to Strapi.
 * Handles query execution, error handling, token management, retry logic, and connection pooling.
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 */

// Environment variables - these will be passed to the constructor
// or loaded from process.env in the server context

/**
 * GraphQL query registry (QIDS)
 * This will be imported from the existing qids.js file
 */
let qids: Record<string, string> = {};

/**
 * Initialize the QIDS registry
 * This is called lazily on first use
 */
async function initQids() {
  if (Object.keys(qids).length === 0) {
    // Dynamically import qids to avoid circular dependencies
    const qidsModule = await import('../../../routes/api/send/qids.js');
    qids = qidsModule.qids;
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Retry on network errors
  if (error instanceof StrapiError) {
    const code = error.getCode();
    // Retry on network errors, timeouts, and 5xx server errors
    return code === 'NETWORK_ERROR' ||
      code === 'HTTP_ERROR' && error.errors[0]?.extensions?.status >= 500;
  }
  return false;
}

/**
 * Connection pool for HTTP keep-alive
 * In Node.js, we can use an Agent to maintain persistent connections
 */
class ConnectionPool {
  private agent: any = null;

  constructor() {
    // Only create agent in Node.js environment
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        // Try to import http/https modules (Node.js only)
        const http = require('http');
        const https = require('https');

        // Create agents with keep-alive enabled
        this.agent = {
          http: new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: 50,
            maxFreeSockets: 10
          }),
          https: new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: 50,
            maxFreeSockets: 10
          })
        };
      } catch (e) {
        // If we can't import http/https, we're probably in a browser-like environment
        // In that case, the browser handles connection pooling automatically
        console.warn('Connection pooling not available in this environment');
      }
    }
  }

  /**
   * Get the appropriate agent for a URL
   */
  getAgent(url: string): any {
    if (!this.agent) return undefined;
    return url.startsWith('https:') ? this.agent.https : this.agent.http;
  }

  /**
   * Destroy all connections in the pool
   */
  destroy(): void {
    if (this.agent) {
      this.agent.http?.destroy();
      this.agent.https?.destroy();
    }
  }
}

/**
 * Strapi GraphQL Client
 * 
 * Executes GraphQL queries and mutations against the Strapi backend.
 * Uses the existing QIDS query registry.
 * Includes retry logic with exponential backoff and connection pooling.
 */
export class StrapiClient {
  private endpoint: string;
  private adminToken: string;
  private retryConfig: RetryConfig;
  private connectionPool: ConnectionPool;

  constructor(
    endpoint?: string,
    adminToken?: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    // Use provided values or fall back to environment variables or defaults
    this.endpoint = endpoint || process.env.VITE_URL || 'https://tovmeod.1lev1.com';
    this.adminToken = adminToken || process.env.VITE_ADMINMONTHER || '';
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.connectionPool = new ConnectionPool();
  }

  /**
   * Destroy the connection pool
   * Call this when shutting down the application
   */
  destroy(): void {
    this.connectionPool.destroy();
  }

  /**
   * Execute a GraphQL query or mutation with retry logic
   * 
   * @param queryId - The QIDS query ID (e.g., '65checkProjectMembership')
   * @param variables - Variables for the GraphQL query
   * @param userJwt - Optional user JWT token (uses admin token if not provided)
   * @param fetchFn - Optional fetch function (uses global fetch if not provided)
   * @returns The GraphQL response data
   * @throws StrapiError if the operation fails after all retries
   */
  async execute(
    queryId: string,
    variables: Record<string, any>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any> {
    let lastError: StrapiError | null = null;
    let delay = this.retryConfig.initialDelayMs;

    // Try the operation with retries
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeOnce(queryId, variables, userJwt, fetchFn);
      } catch (error) {
        lastError = error instanceof StrapiError ? error : new StrapiError([{
          message: error instanceof Error ? error.message : String(error),
          extensions: { code: 'UNKNOWN_ERROR' }
        }]);

        // If this is the last attempt or error is not retryable, throw
        if (attempt === this.retryConfig.maxRetries || !isRetryableError(lastError)) {
          throw lastError;
        }

        // Log retry attempt
        console.warn(
          `Strapi request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), ` +
          `retrying in ${delay}ms...`,
          { queryId, error: lastError.message }
        );

        // Wait before retrying
        await sleep(delay);

        // Exponential backoff
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelayMs
        );
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Execute a GraphQL query or mutation once (without retry logic)
   * 
   * @param queryId - The QIDS query ID
   * @param variables - Variables for the GraphQL query
   * @param userJwt - Optional user JWT token
   * @param fetchFn - Optional fetch function (uses global fetch if not provided)
   * @returns The GraphQL response data
   * @throws StrapiError if the operation fails
   */
  private async executeOnce(
    queryId: string,
    variables: Record<string, any>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any> {
    // Initialize QIDS if not already done
    await initQids();

    // Get the query from QIDS
    const query = qids[queryId];
    if (!query) {
      throw new StrapiError([{
        message: `GraphQL query ${queryId} not found in QIDS`,
        extensions: { code: 'QUERY_NOT_FOUND' }
      }]);
    }

    // Determine which token to use
    const token = userJwt || this.adminToken;
    const bearer = `bearer ${token}`;

    // Prepare the request body
    const requestBody = {
      query,
      variables
    };

    // Prepare fetch options with connection pooling
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': bearer
      },
      body: JSON.stringify(requestBody)
    };

    // Add agent for connection pooling (Node.js only)
    const agent = this.connectionPool.getAgent(this.endpoint);
    if (agent) {
      (fetchOptions as any).agent = agent;
    }

    // Use provided fetch or global fetch
    const fetchToUse = fetchFn || fetch;

    try {
      // Execute the GraphQL request
      const response = await fetchToUse(this.endpoint, fetchOptions);

      // Check if the HTTP request was successful
      if (!response.ok) {
        // Try to get response body for more details
        let responseBody: any;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }

        console.error('[STRAPI_CLIENT] HTTP Error Details:', {
          queryId,
          status: response.status,
          statusText: response.statusText,
          endpoint: this.endpoint,
          variables: JSON.stringify(variables, null, 2),
          responseBody: JSON.stringify(responseBody, null, 2)
        });

        throw new StrapiError([{
          message: `HTTP ${response.status}: ${response.statusText}`,
          extensions: {
            code: 'HTTP_ERROR',
            status: response.status,
            statusText: response.statusText,
            queryId,
            variables,
            responseBody
          }
        }]);
      }

      // Parse the response
      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        console.error('[STRAPI_CLIENT] GraphQL Error Details:', {
          queryId,
          variables: JSON.stringify(variables, null, 2),
          query: query.substring(0, 200) + '...',
          errors: JSON.stringify(result.errors, null, 2)
        });

        throw new StrapiError(result.errors.map((err: any) => ({
          ...err,
          extensions: {
            ...err.extensions,
            queryId,
            variables
          }
        })));
      }

      return result;
    } catch (error) {
      // If it's already a StrapiError, re-throw it
      if (error instanceof StrapiError) {
        throw error;
      }

      // Log network errors with details
      console.error('[STRAPI_CLIENT] Network Error Details:', {
        queryId,
        variables: JSON.stringify(variables, null, 2),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Wrap other errors in StrapiError
      throw new StrapiError([{
        message: error instanceof Error ? error.message : String(error),
        extensions: {
          code: 'NETWORK_ERROR',
          queryId,
          variables
        }
      }]);
    }
  }
}

/**
 * Strapi Error
 * 
 * Custom error class for Strapi GraphQL errors
 */
export class StrapiError extends Error {
  public errors: Array<{
    message: string;
    extensions?: {
      code?: string;
      [key: string]: any;
    };
  }>;

  constructor(errors: Array<{ message: string; extensions?: any }>) {
    super(errors[0]?.message || 'Strapi operation failed');
    this.name = 'StrapiError';
    this.errors = errors;
  }

  /**
   * Get the first error code
   */
  getCode(): string | undefined {
    return this.errors[0]?.extensions?.code;
  }

  /**
   * Get all error messages
   */
  getMessages(): string[] {
    return this.errors.map(e => e.message);
  }
}
