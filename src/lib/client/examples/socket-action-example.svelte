<!--
  Example: Using Socket Client and Action Client Together
  
  This example demonstrates how to:
  1. Monitor socket connection status
  2. Execute actions via the Action API
  3. Receive real-time notifications
  4. Handle errors gracefully
-->

<script lang="ts">
  import { socketClient } from '$lib/stores/socketClient';
  import { executeAction, displayActionError, displayActionSuccess } from '$lib/client/actionClient';
  import { onMount, onDestroy } from 'svelte';
  import { locale } from '$lib/translations';

  // Component state
  let taskId = $state('');
  let taskStatus = $state('in_progress');
  let loading = $state(false);
  let notifications = $state<any[]>([]);

  // Subscribe to socket state
  const socketState = $derived($socketClient);

  // Handle task update
  async function updateTask() {
    if (!taskId) {
      alert('Please enter a task ID');
      return;
    }

    loading = true;

    try {
      const result = await executeAction('updateTask', {
        taskId,
        status: taskStatus
      });

      if (result.success) {
        displayActionSuccess('Task updated successfully!');
        taskId = '';
      } else {
        displayActionError(result.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      displayActionError({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      });
    } finally {
      loading = false;
    }
  }

  // Listen for notifications
  let unsubscribeNotifications: (() => void) | null = null;

  onMount(() => {
    // Register notification listener
    unsubscribeNotifications = socketClient.onNotification((notification) => {
      console.log('Received notification:', notification);
      
      // Add to notifications list
      notifications = [
        {
          ...notification,
          timestamp: new Date()
        },
        ...notifications
      ].slice(0, 10); // Keep last 10 notifications
    });
  });

  onDestroy(() => {
    // Cleanup notification listener
    if (unsubscribeNotifications) {
      unsubscribeNotifications();
    }
  });

  // Format notification message
  function formatNotification(notification: any): string {
    const lang = $locale || 'he';
    const title = notification.title[lang] || notification.title.he || '';
    const body = notification.body[lang] || notification.body.he || '';
    return `${title}: ${body}`;
  }
</script>

<div class="example-container">
  <h2>Socket & Action Client Example</h2>

  <!-- Connection Status -->
  <div class="status-section">
    <h3>Connection Status</h3>
    <div class="status-grid">
      <div class="status-item">
        <span class="label">Connected:</span>
        <span class="value" class:success={socketState.connected} class:error={!socketState.connected}>
          {socketState.connected ? '✓' : '✗'}
        </span>
      </div>
      <div class="status-item">
        <span class="label">Authenticated:</span>
        <span class="value" class:success={socketState.authenticated} class:error={!socketState.authenticated}>
          {socketState.authenticated ? '✓' : '✗'}
        </span>
      </div>
      <div class="status-item">
        <span class="label">User ID:</span>
        <span class="value">{socketState.userId || 'N/A'}</span>
      </div>
      {#if socketState.reconnecting}
        <div class="status-item">
          <span class="label">Reconnecting:</span>
          <span class="value warning">Attempt {socketState.reconnectAttempts}</span>
        </div>
      {/if}
      {#if socketState.error}
        <div class="status-item error-item">
          <span class="label">Error:</span>
          <span class="value error">{socketState.error}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Form -->
  <div class="action-section">
    <h3>Execute Action</h3>
    <form onsubmit={(e) => { e.preventDefault(); updateTask(); }}>
      <div class="form-group">
        <label for="taskId">Task ID:</label>
        <input
          id="taskId"
          type="text"
          bind:value={taskId}
          placeholder="Enter task ID"
          disabled={loading}
        />
      </div>
      <div class="form-group">
        <label for="status">Status:</label>
        <select id="status" bind:value={taskStatus} disabled={loading}>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <button type="submit" disabled={loading || !socketState.connected}>
        {loading ? 'Updating...' : 'Update Task'}
      </button>
    </form>
  </div>

  <!-- Notifications -->
  <div class="notifications-section">
    <h3>Recent Notifications ({notifications.length})</h3>
    {#if notifications.length === 0}
      <p class="empty-state">No notifications yet. Try updating a task!</p>
    {:else}
      <div class="notifications-list">
        {#each notifications as notification}
          <div class="notification-item">
            <div class="notification-header">
              <span class="notification-time">
                {notification.timestamp.toLocaleTimeString()}
              </span>
              {#if notification.actionKey}
                <span class="notification-action">{notification.actionKey}</span>
              {/if}
            </div>
            <div class="notification-body">
              {formatNotification(notification)}
            </div>
            {#if notification.metadata?.url}
              <a href={notification.metadata.url} class="notification-link">
                View →
              </a>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .example-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h2 {
    margin-bottom: 2rem;
    color: #333;
  }

  h3 {
    margin-bottom: 1rem;
    color: #555;
    font-size: 1.2rem;
  }

  .status-section,
  .action-section,
  .notifications-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }

  .status-item.error-item {
    grid-column: 1 / -1;
  }

  .label {
    font-weight: 600;
    color: #666;
  }

  .value {
    font-weight: 500;
  }

  .value.success {
    color: #22c55e;
  }

  .value.error {
    color: #ef4444;
  }

  .value.warning {
    color: #f59e0b;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  input,
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:disabled,
  select:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #2563eb;
  }

  button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .empty-state {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notification-item {
    padding: 1rem;
    background: white;
    border-radius: 4px;
    border-left: 4px solid #3b82f6;
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .notification-time {
    font-size: 0.875rem;
    color: #999;
  }

  .notification-action {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #e0e7ff;
    color: #3730a3;
    border-radius: 4px;
    font-weight: 600;
  }

  .notification-body {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .notification-link {
    display: inline-block;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .notification-link:hover {
    text-decoration: underline;
  }
</style>
