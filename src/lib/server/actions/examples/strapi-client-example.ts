/**
 * StrapiClient Usage Examples
 * 
 * This file demonstrates how to use the StrapiClient with various configurations
 */

import { StrapiClient, StrapiError } from '../StrapiClient';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

async function basicUsage() {
  // Create a client with default settings
  const client = new StrapiClient();
  
  try {
    // Execute a query using QIDS
    const result = await client.execute(
      '3projectJSONQue',  // QIDS query ID
      { pid: '123' },     // Variables
      'user-jwt-token'    // Optional user JWT
    );
    
    console.log('Project data:', result.data);
  } catch (error) {
    if (error instanceof StrapiError) {
      console.error('Strapi error:', error.getCode(), error.message);
    }
  } finally {
    // Clean up connection pool
    client.destroy();
  }
}

// ============================================================================
// Example 2: Custom Retry Configuration
// ============================================================================

async function customRetryConfig() {
  // Create a client with custom retry settings
  const client = new StrapiClient(
    'https://api.1lev1.com',
    'admin-token',
    {
      maxRetries: 5,           // Try up to 5 times
      initialDelayMs: 200,     // Start with 200ms delay
      maxDelayMs: 10000,       // Cap at 10 seconds
      backoffMultiplier: 3     // Triple delay each time
    }
  );
  
  try {
    // This will retry up to 5 times with aggressive backoff
    const result = await client.execute('testQuery', { id: '1' });
    console.log('Result:', result);
  } catch (error) {
    console.error('Failed after all retries:', error);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// Example 3: Error Handling
// ============================================================================

async function errorHandling() {
  const client = new StrapiClient();
  
  try {
    const result = await client.execute('getUserData', { userId: '123' });
    return result.data;
  } catch (error) {
    if (error instanceof StrapiError) {
      const code = error.getCode();
      
      switch (code) {
        case 'QUERY_NOT_FOUND':
          console.error('Invalid query ID - check QIDS registry');
          break;
          
        case 'HTTP_ERROR':
          console.error('HTTP error:', error.message);
          // Check if it's a 4xx or 5xx error
          const status = error.errors[0]?.extensions?.status;
          if (status >= 500) {
            console.error('Server error - may be temporary');
          } else if (status >= 400) {
            console.error('Client error - check request');
          }
          break;
          
        case 'NETWORK_ERROR':
          console.error('Network error - check connection');
          break;
          
        default:
          // GraphQL errors
          console.error('GraphQL errors:', error.getMessages());
      }
    }
    throw error;
  } finally {
    client.destroy();
  }
}

// ============================================================================
// Example 4: Using with Admin Token vs User JWT
// ============================================================================

async function tokenUsage() {
  const client = new StrapiClient();
  
  // Use admin token (default)
  const adminResult = await client.execute('adminQuery', { id: '1' });
  
  // Use user JWT for user-specific operations
  const userJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  const userResult = await client.execute('userQuery', { id: '1' }, userJwt);
  
  client.destroy();
}

// ============================================================================
// Example 5: Integration with Action System
// ============================================================================

async function actionSystemIntegration() {
  // In the Action System, StrapiClient is used like this:
  
  const client = new StrapiClient();
  
  try {
    // Check project membership
    const membershipResult = await client.execute(
      '65checkProjectMembership',
      { uid: 'user-123', projectId: 'project-456' },
      'user-jwt-token'
    );
    
    const isMember = membershipResult?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data?.length > 0;
    
    if (!isMember) {
      throw new Error('User is not a project member');
    }
    
    // Execute the actual action
    const actionResult = await client.execute(
      '31updateTask',
      { taskId: 'task-789', status: 'completed' },
      'user-jwt-token'
    );
    
    return actionResult;
  } finally {
    client.destroy();
  }
}

// ============================================================================
// Example 6: Handling Retries
// ============================================================================

async function retryExample() {
  const client = new StrapiClient();
  
  try {
    // This will automatically retry on network errors or 5xx errors
    // Logs will show retry attempts:
    // "Strapi request failed (attempt 1/4), retrying in 100ms..."
    // "Strapi request failed (attempt 2/4), retrying in 200ms..."
    // etc.
    
    const result = await client.execute('unreliableQuery', { id: '1' });
    console.log('Success after retries:', result);
  } catch (error) {
    // If all retries fail, error is thrown
    console.error('Failed after all retries:', error);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// Example 7: Connection Pool Benefits
// ============================================================================

async function connectionPoolExample() {
  const client = new StrapiClient();
  
  // Multiple requests will reuse the same HTTP connection
  // This is much faster than creating a new connection each time
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      client.execute('fastQuery', { id: i.toString() })
    );
  }
  
  // All 10 requests will use the connection pool
  const results = await Promise.all(promises);
  console.log('Completed 10 requests efficiently:', results.length);
  
  client.destroy();
}

// ============================================================================
// Example 8: Environment-Specific Configuration
// ============================================================================

async function environmentConfig() {
  // Development
  const devClient = new StrapiClient(
    'http://localhost:1337',
    'dev-admin-token',
    { maxRetries: 1 } // Fail fast in development
  );
  
  // Production
  const prodClient = new StrapiClient(
    'https://api.1lev1.com',
    process.env.VITE_ADMINMONTHER,
    { maxRetries: 5, maxDelayMs: 10000 } // More resilient in production
  );
  
  // Use appropriate client based on environment
  const client = process.env.NODE_ENV === 'production' ? prodClient : devClient;
  
  try {
    const result = await client.execute('query', { id: '1' });
    return result;
  } finally {
    client.destroy();
  }
}

// Export examples for documentation
export {
  basicUsage,
  customRetryConfig,
  errorHandling,
  tokenUsage,
  actionSystemIntegration,
  retryExample,
  connectionPoolExample,
  environmentConfig
};
