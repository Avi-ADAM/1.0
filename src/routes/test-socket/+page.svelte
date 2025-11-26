<!--
  Socket Client Test Page
  
  This page provides a visual interface to test the Socket.IO client.
  Navigate to /test-socket to use it.
-->

<script lang="ts">
  import { socketClient } from '$lib/stores/socketClient';
  import { executeAction } from '$lib/client/actionClient';
  import { onMount, onDestroy } from 'svelte';
  import { locale } from '$lib/translations';
  import { page } from '$app/stores';

  // Get user data from page store
  const userData = $derived($page.data);

  // Socket state
  const socketState = $derived($socketClient);

  // Test state
  let notifications = $state<any[]>([]);
  let testUserId = $state('');
  let testJwt = $state('');
  let manualConnect = $state(false);

  // Auto-populate from page data
  $effect(() => {
    if (userData?.id && !testUserId) {
      testUserId = String(userData.id);
    }
    if (userData?.jwt && !testJwt) {
      testJwt = userData.jwt;
    }
  });

  // Manual connection
  function handleConnect() {
    if (!testUserId || !testJwt) {
      alert('Please enter User ID and JWT');
      return;
    }
    socketClient.connect(testUserId, testJwt);
    manualConnect = true;
  }

  function handleDisconnect() {
    socketClient.disconnect();
    manualConnect = false;
  }

  function handlePing() {
    socketClient.ping();
  }

  function clearNotifications() {
    notifications = [];
  }

  // Listen for notifications
  let unsubscribeNotifications: (() => void) | null = null;

  onMount(() => {
    unsubscribeNotifications = socketClient.onNotification((notification) => {
      console.log('[Test Page] Received notification:', notification);
      notifications = [
        {
          ...notification,
          timestamp: new Date()
        },
        ...notifications
      ];
    });
  });

  onDestroy(() => {
    if (unsubscribeNotifications) {
      unsubscribeNotifications();
    }
  });

  // Format notification
  function formatNotification(notification: any): string {
    const lang = $locale || 'he';
    const title = notification.title?.[lang] || notification.title?.he || 'No title';
    const body = notification.body?.[lang] || notification.body?.he || 'No body';
    return `${title}: ${body}`;
  }

  // Status color
  const statusColor = $derived(
    socketState.connected && socketState.authenticated ? 'green' :
    socketState.reconnecting ? 'orange' :
    socketState.error ? 'red' : 'gray'
  );
</script>

<svelte:head>
  <title>Socket Client Test</title>
</svelte:head>

<div class="container">
  <h1>Socket.IO Client Test Page</h1>

  <!-- Connection Controls -->
  <section class="card">
    <h2>Connection</h2>
    
    <div class="form-group">
      <label for="userId">User ID:</label>
      <input
        id="userId"
        type="text"
        bind:value={testUserId}
        placeholder="Enter user ID"
        disabled={socketState.connected}
      />
    </div>

    <div class="form-group">
      <label for="jwt">JWT Token:</label>
      <input
        id="jwt"
        type="password"
        bind:value={testJwt}
        placeholder="Enter JWT token"
        disabled={socketState.connected}
      />
    </div>

    <div class="button-group">
      {#if !socketState.connected}
        <button onclick={handleConnect} class="btn-primary">
          Connect
        </button>
      {:else}
        <button onclick={handleDisconnect} class="btn-danger">
          Disconnect
        </button>
        <button onclick={handlePing} class="btn-secondary">
          Ping
        </button>
      {/if}
    </div>
  </section>

  <!-- Connection Status -->
  <section class="card">
    <h2>Status</h2>
    
    <div class="status-grid">
      <div class="status-item">
        <span class="label">Connection:</span>
        <span class="badge" style="background-color: {statusColor}">
          {socketState.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div class="status-item">
        <span class="label">Authenticated:</span>
        <span class="badge" style="background-color: {socketState.authenticated ? 'green' : 'gray'}">
          {socketState.authenticated ? 'Yes' : 'No'}
        </span>
      </div>

      <div class="status-item">
        <span class="label">User ID:</span>
        <span class="value">{socketState.userId || 'N/A'}</span>
      </div>

      {#if socketState.reconnecting}
        <div class="status-item">
          <span class="label">Reconnecting:</span>
          <span class="badge" style="background-color: orange">
            Attempt {socketState.reconnectAttempts}
          </span>
        </div>
      {/if}

      {#if socketState.error}
        <div class="status-item error-item">
          <span class="label">Error:</span>
          <span class="value error">{socketState.error}</span>
        </div>
      {/if}
    </div>
  </section>

  <!-- Notifications -->
  <section class="card">
    <div class="section-header">
      <h2>Notifications ({notifications.length})</h2>
      {#if notifications.length > 0}
        <button onclick={clearNotifications} class="btn-secondary btn-sm">
          Clear
        </button>
      {/if}
    </div>

    {#if notifications.length === 0}
      <div class="empty-state">
        <p>No notifications received yet.</p>
        <p class="hint">
          Trigger an action from another tab or use the Action API to send a notification.
        </p>
      </div>
    {:else}
      <div class="notifications-list">
        {#each notifications as notification, i}
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
            <details class="notification-details">
              <summary>Raw Data</summary>
              <pre>{JSON.stringify(notification, null, 2)}</pre>
            </details>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Instructions -->
  <section class="card">
    <h2>Testing Instructions</h2>
    <ol>
      <li>Make sure the Socket.IO server is running on port 3001</li>
      <li>Enter your User ID and JWT token (or they'll be auto-filled if logged in)</li>
      <li>Click "Connect" to establish connection</li>
      <li>Trigger an action from another tab or component</li>
      <li>Watch notifications appear in real-time</li>
    </ol>

    <div class="info-box">
      <strong>Socket Server URL:</strong> {import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'}
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    margin-bottom: 2rem;
    color: #333;
    font-size: 2rem;
  }

  h2 {
    margin: 0 0 1rem 0;
    color: #555;
    font-size: 1.5rem;
  }

  .card {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
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

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 4px;
  }

  .status-item.error-item {
    grid-column: 1 / -1;
    background: #fee;
  }

  .label {
    font-weight: 600;
    color: #666;
  }

  .value {
    font-weight: 500;
    color: #333;
  }

  .value.error {
    color: #ef4444;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    font-style: italic;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notification-item {
    padding: 1rem;
    background: #f9f9f9;
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
    margin-bottom: 0.5rem;
  }

  .notification-link:hover {
    text-decoration: underline;
  }

  .notification-details {
    margin-top: 0.5rem;
  }

  .notification-details summary {
    cursor: pointer;
    color: #666;
    font-size: 0.875rem;
  }

  .notification-details pre {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.75rem;
    overflow-x: auto;
  }

  ol {
    margin: 0;
    padding-left: 1.5rem;
  }

  ol li {
    margin-bottom: 0.5rem;
    color: #555;
  }

  .info-box {
    margin-top: 1rem;
    padding: 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 4px;
    color: #0c4a6e;
  }
</style>
