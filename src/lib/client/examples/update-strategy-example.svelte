<script lang="ts">
/**
 * Update Strategy Example
 * 
 * This example demonstrates how to use different update strategies
 * with the Unified Action System.
 */

import { onMount } from 'svelte';
import { executeAction } from '$lib/client/actionClient';
import { registerUpdateStrategies, registerStrategy } from '$lib/client/updateStrategies';
import { socketClient } from '$lib/stores/socketClient';
import { writable } from 'svelte/store';

// Example data stores
const tasks = writable<any[]>([]);
const project = writable<any>(null);

// Register all built-in update strategies
onMount(() => {
  registerUpdateStrategies();
  
  // Register custom update strategy for this component
  registerStrategy('updateLocalTasks', (data) => {
    console.log('Custom update strategy called', data);
    tasks.update(current => [...current, data]);
  });
});

// ============================================================================
// Example 1: Full Refresh Strategy
// ============================================================================

async function exampleFullRefresh() {
  console.log('=== Example 1: Full Refresh ===');
  
  // This action uses fullRefresh strategy
  // After completion, all page data will be reloaded
  const result = await executeAction('createProject', {
    projectName: 'New Project',
    description: 'A test project'
  });
  
  if (result.success) {
    console.log('Project created, page will refresh all data');
    // The fullRefresh strategy automatically invalidates all data
  }
}

// ============================================================================
// Example 2: Partial Update Strategy
// ============================================================================

async function examplePartialUpdate() {
  console.log('=== Example 2: Partial Update ===');
  
  // This action uses partialUpdate strategy with specific data keys
  // Only the specified data keys will be refreshed
  const result = await executeAction('updateTask', {
    taskId: '123',
    status: 'completed'
  });
  
  if (result.success) {
    console.log('Task updated, only arr1 will refresh');
    // The partialUpdate strategy invalidates only 'arr1' data key
    // This is more efficient than full refresh
  }
}

// ============================================================================
// Example 3: Optimistic Update Strategy
// ============================================================================

async function exampleOptimisticUpdate() {
  console.log('=== Example 3: Optimistic Update ===');
  
  // This action uses optimistic strategy with a custom update function
  // The UI updates immediately without waiting for server confirmation
  const result = await executeAction('startTimer', {
    timerId: '456'
  });
  
  if (result.success) {
    console.log('Timer started, UI updated optimistically');
    // The optimistic strategy calls the updateTimerState function
    // which updates the UI immediately for better UX
  }
}

// ============================================================================
// Example 4: No Update Strategy
// ============================================================================

async function exampleNoUpdate() {
  console.log('=== Example 4: No Update ===');
  
  // This action uses 'none' strategy
  // No automatic UI updates will occur
  const result = await executeAction('logEvent', {
    eventType: 'page_view',
    page: '/example'
  });
  
  if (result.success) {
    console.log('Event logged, no UI update needed');
    // The 'none' strategy doesn't trigger any updates
    // Useful for actions that don't affect visible state
  }
}

// ============================================================================
// Example 5: Custom Update Function
// ============================================================================

async function exampleCustomUpdate() {
  console.log('=== Example 5: Custom Update Function ===');
  
  // This action uses a custom update function registered above
  const result = await executeAction('createTask', {
    projectId: '789',
    title: 'New Task',
    description: 'Task description'
  });
  
  if (result.success) {
    console.log('Task created, custom update function called');
    // The custom 'updateLocalTasks' function adds the task to our local store
  }
}

// ============================================================================
// Example 6: Socket Updates with Strategies
// ============================================================================

onMount(() => {
  // Listen for socket notifications
  const unsubscribe = socketClient.onNotification((notification) => {
    console.log('=== Example 6: Socket Update ===');
    console.log('Received notification:', notification);
    
    // Socket notifications can include update strategies
    // The socketClient automatically applies them
    if (notification.data?.updateStrategy) {
      console.log('Update strategy from socket:', notification.data.updateStrategy);
    }
  });
  
  return unsubscribe;
});

// ============================================================================
// Example 7: Manual Update Strategy Execution
// ============================================================================

async function exampleManualStrategy() {
  console.log('=== Example 7: Manual Strategy ===');
  
  // You can skip automatic strategy execution and handle it manually
  const result = await executeAction('updateUser', {
    userId: '999',
    username: 'newname'
  }, {
    skipUpdateStrategy: true // Don't execute strategy automatically
  });
  
  if (result.success) {
    console.log('User updated, handling strategy manually');
    
    // Manually execute the update strategy
    if (result.updateStrategy) {
      if (result.updateStrategy.type === 'partialUpdate') {
        console.log('Manually refreshing:', result.updateStrategy.config?.dataKeys);
        // Custom handling logic here
      }
    }
  }
}

// ============================================================================
// Example 8: Error Handling with Strategies
// ============================================================================

async function exampleErrorHandling() {
  console.log('=== Example 8: Error Handling ===');
  
  const result = await executeAction('deleteTask', {
    taskId: 'invalid-id'
  }, {
    onSuccess: (data) => {
      console.log('Success callback:', data);
      // Custom success handling
    },
    onError: (error) => {
      console.error('Error callback:', error);
      // Custom error handling
      // Update strategy is NOT executed on error
    }
  });
  
  if (!result.success) {
    console.log('Action failed, no update strategy executed');
  }
}

// ============================================================================
// Example 9: Combining Multiple Strategies
// ============================================================================

async function exampleCombinedStrategies() {
  console.log('=== Example 9: Combined Strategies ===');
  
  // Execute multiple actions with different strategies
  const results = await Promise.all([
    executeAction('createTask', { title: 'Task 1' }),
    executeAction('updateProject', { projectId: '123' }),
    executeAction('sendNotification', { userId: '456' })
  ]);
  
  console.log('Multiple actions completed:', results);
  // Each action's update strategy is executed independently
}

// ============================================================================
// Example 10: Store Integration
// ============================================================================

import { createStoreUpdateStrategy, createAppendStrategy } from '$lib/client/updateStrategies';

onMount(() => {
  // Create a custom strategy that updates our tasks store
  const taskAppendStrategy = createAppendStrategy(tasks);
  registerStrategy('appendTask', taskAppendStrategy);
  
  // Create a custom strategy that updates project store
  const projectUpdateStrategy = createStoreUpdateStrategy(
    project,
    (current, data) => ({ ...current, ...data })
  );
  registerStrategy('updateProjectStore', projectUpdateStrategy);
});

</script>

<div class="update-strategy-examples">
  <h1>Update Strategy Examples</h1>
  
  <div class="examples">
    <section>
      <h2>1. Full Refresh</h2>
      <p>Reloads all page data after action completes</p>
      <button on:click={exampleFullRefresh}>Run Example</button>
    </section>
    
    <section>
      <h2>2. Partial Update</h2>
      <p>Refreshes only specific data keys</p>
      <button on:click={examplePartialUpdate}>Run Example</button>
    </section>
    
    <section>
      <h2>3. Optimistic Update</h2>
      <p>Updates UI immediately for better UX</p>
      <button on:click={exampleOptimisticUpdate}>Run Example</button>
    </section>
    
    <section>
      <h2>4. No Update</h2>
      <p>No automatic UI updates</p>
      <button on:click={exampleNoUpdate}>Run Example</button>
    </section>
    
    <section>
      <h2>5. Custom Update Function</h2>
      <p>Uses custom registered function</p>
      <button on:click={exampleCustomUpdate}>Run Example</button>
    </section>
    
    <section>
      <h2>6. Socket Updates</h2>
      <p>Real-time updates via Socket.IO</p>
      <p class="info">Check console for socket notifications</p>
    </section>
    
    <section>
      <h2>7. Manual Strategy</h2>
      <p>Skip automatic execution and handle manually</p>
      <button on:click={exampleManualStrategy}>Run Example</button>
    </section>
    
    <section>
      <h2>8. Error Handling</h2>
      <p>Strategies don't execute on errors</p>
      <button on:click={exampleErrorHandling}>Run Example</button>
    </section>
    
    <section>
      <h2>9. Combined Strategies</h2>
      <p>Multiple actions with different strategies</p>
      <button on:click={exampleCombinedStrategies}>Run Example</button>
    </section>
  </div>
  
  <div class="state">
    <h2>Current State</h2>
    <div>
      <h3>Tasks ({$tasks.length})</h3>
      <pre>{JSON.stringify($tasks, null, 2)}</pre>
    </div>
    <div>
      <h3>Project</h3>
      <pre>{JSON.stringify($project, null, 2)}</pre>
    </div>
  </div>
</div>

<style>
  .update-strategy-examples {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    margin-bottom: 2rem;
  }
  
  .examples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  section {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
  }
  
  section h2 {
    margin-top: 0;
    font-size: 1.2rem;
  }
  
  section p {
    color: #666;
    margin: 0.5rem 0;
  }
  
  button {
    background: #0066cc;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  button:hover {
    background: #0052a3;
  }
  
  .info {
    font-style: italic;
    font-size: 0.9rem;
  }
  
  .state {
    border-top: 2px solid #ddd;
    padding-top: 2rem;
  }
  
  .state > div {
    margin-bottom: 1rem;
  }
  
  .state h3 {
    margin-top: 0;
  }
  
  pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85rem;
  }
</style>
