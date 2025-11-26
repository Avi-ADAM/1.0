<script lang="ts">
  /**
   * Migration Demo Page
   * 
   * This page demonstrates the migration from the old sendToSer system
   * to the new unified action system. It shows both approaches side-by-side
   * for comparison and testing.
   */
  
  import TaskApprovalButton from '$lib/components/lev/TaskApprovalButton.svelte';
  import { updateTask } from '$lib/client/actionClient';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { lang } from '$lib/stores/lang.js';
  import { onMount } from 'svelte';
  
  let taskId = $state('');
  let projectId = $state('');
  let testResults = $state<any[]>([]);
  let socketConnected = $state(false);
  let notificationsReceived = $state<any[]>([]);
  
  // Listen for socket updates
  onMount(() => {
    if (typeof window !== 'undefined') {
      // Check if socket client is available
      import('$lib/stores/socketClient').then(({ socketClient }) => {
        socketClient.subscribe((client) => {
          socketConnected = client?.connected || false;
        });
        
        // Listen for notifications
        const handleNotification = (data: any) => {
          console.log('Received notification:', data);
          notificationsReceived = [...notificationsReceived, {
            timestamp: new Date().toISOString(),
            data
          }];
        };
        
        if (typeof window !== 'undefined' && (window as any).io) {
          const socket = (window as any).io;
          socket?.on('notification', handleNotification);
          
          return () => {
            socket?.off('notification', handleNotification);
          };
        }
      });
    }
  });
  
  async function testNewSystem() {
    if (!taskId || !projectId) {
      alert('Please enter Task ID and Project ID');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      const response = await updateTask({
        id: taskId,
        projectId: projectId,
        myIshur: true
      }, {
        showSuccessToast: false // Don't show toast in test
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      testResults = [...testResults, {
        system: 'NEW',
        success: response.success,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        data: response.data,
        updateStrategy: response.updateStrategy
      }];
      
      console.log('New system result:', response);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      testResults = [...testResults, {
        system: 'NEW',
        success: false,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        error: error
      }];
      
      console.error('New system error:', error);
    }
  }
  
  async function testOldSystem() {
    if (!taskId || !projectId) {
      alert('Please enter Task ID and Project ID');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      const result = await sendToSer(
        { 
          id: taskId, 
          myIshur: true,
          projectId: projectId 
        },
        '31updateTask',
        null,
        null,
        false,
        fetch
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      testResults = [...testResults, {
        system: 'OLD',
        success: !!result?.data?.updateAct?.data,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        data: result
      }];
      
      console.log('Old system result:', result);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      testResults = [...testResults, {
        system: 'OLD',
        success: false,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        error: error
      }];
      
      console.error('Old system error:', error);
    }
  }
  
  function clearResults() {
    testResults = [];
    notificationsReceived = [];
  }
</script>

<svelte:head>
  <title>Action System Migration Demo</title>
</svelte:head>

<div class="migration-demo" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  <header>
    <h1>🚀 Action System Migration Demo</h1>
    <p>Compare the old sendToSer system with the new unified action system</p>
  </header>
  
  <div class="status-bar">
    <div class="status-item">
      <span class="label">Socket Status:</span>
      <span class="value" class:connected={socketConnected}>
        {socketConnected ? '✓ Connected' : '✗ Disconnected'}
      </span>
    </div>
    <div class="status-item">
      <span class="label">Notifications Received:</span>
      <span class="value">{notificationsReceived.length}</span>
    </div>
  </div>
  
  <section class="test-inputs">
    <h2>Test Parameters</h2>
    <div class="input-group">
      <label for="taskId">Task ID:</label>
      <input
        id="taskId"
        type="text"
        bind:value={taskId}
        placeholder="Enter task ID (e.g., 123)"
      />
    </div>
    <div class="input-group">
      <label for="projectId">Project ID:</label>
      <input
        id="projectId"
        type="text"
        bind:value={projectId}
        placeholder="Enter project ID (e.g., 456)"
      />
    </div>
  </section>
  
  <section class="comparison">
    <div class="system-card old-system">
      <h3>❌ Old System (sendToSer)</h3>
      <ul class="features">
        <li>Direct GraphQL calls</li>
        <li>Manual validation</li>
        <li>No automatic notifications</li>
        <li>No update strategies</li>
        <li>Manual error handling</li>
      </ul>
      <button onclick={testOldSystem} class="test-button old">
        Test Old System
      </button>
    </div>
    
    <div class="system-card new-system">
      <h3>✅ New System (Action Client)</h3>
      <ul class="features">
        <li>Centralized action registry</li>
        <li>Automatic validation</li>
        <li>Multi-channel notifications</li>
        <li>Smart update strategies</li>
        <li>Consistent error handling</li>
      </ul>
      <button onclick={testNewSystem} class="test-button new">
        Test New System
      </button>
    </div>
  </section>
  
  <section class="component-demo">
    <h2>Component Demo</h2>
    <p>This button uses the new action system:</p>
    <div class="demo-area">
      {#if taskId && projectId}
        <TaskApprovalButton
          {taskId}
          {projectId}
          taskName="Demo Task"
          onSuccess={() => {
            console.log('Task approved via component!');
          }}
          onError={(error) => {
            console.error('Component error:', error);
          }}
        />
      {:else}
        <p class="hint">Enter Task ID and Project ID above to enable the button</p>
      {/if}
    </div>
  </section>
  
  {#if testResults.length > 0}
    <section class="results">
      <div class="results-header">
        <h2>Test Results</h2>
        <button onclick={clearResults} class="clear-button">Clear Results</button>
      </div>
      <div class="results-grid">
        {#each testResults as result, i}
          <div class="result-card" class:success={result.success} class:error={!result.success}>
            <div class="result-header">
              <span class="system-badge" class:old={result.system === 'OLD'} class:new={result.system === 'NEW'}>
                {result.system}
              </span>
              <span class="status-badge" class:success={result.success}>
                {result.success ? '✓ Success' : '✗ Failed'}
              </span>
            </div>
            <div class="result-details">
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">{result.duration}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              {#if result.updateStrategy}
                <div class="detail-row">
                  <span class="label">Update Strategy:</span>
                  <span class="value">{result.updateStrategy.type}</span>
                </div>
              {/if}
            </div>
            <details>
              <summary>View Response Data</summary>
              <pre>{JSON.stringify(result.data || result.error, null, 2)}</pre>
            </details>
          </div>
        {/each}
      </div>
    </section>
  {/if}
  
  {#if notificationsReceived.length > 0}
    <section class="notifications">
      <h2>Received Notifications</h2>
      <div class="notifications-list">
        {#each notificationsReceived as notification}
          <div class="notification-card">
            <div class="notification-header">
              <span class="timestamp">{new Date(notification.timestamp).toLocaleTimeString()}</span>
            </div>
            <pre>{JSON.stringify(notification.data, null, 2)}</pre>
          </div>
        {/each}
      </div>
    </section>
  {/if}
  
  <section class="migration-guide">
    <h2>Migration Guide</h2>
    <div class="code-comparison">
      <div class="code-block">
        <h3>Before (Old System)</h3>
        <pre><code>{`import { sendToSer } from '$lib/send/sendToSer.js';

async function approveTask() {
  const result = await sendToSer(
    { 
      id: taskId, 
      myIshur: true,
      projectId: projectId 
    },
    '31updateTask',
    null,
    null,
    false,
    fetch
  );
  
  // Manual notification handling
  // Manual UI refresh
  // Manual error handling
}`}</code></pre>
      </div>
      
      <div class="code-block">
        <h3>After (New System)</h3>
        <pre><code>{`import { updateTask } from '$lib/client/actionClient';

async function approveTask() {
  await updateTask({
    id: taskId,
    projectId: projectId,
    myIshur: true
  }, {
    showSuccessToast: true,
    successMessage: 'Task approved!'
  });
  
  // Automatic notifications ✓
  // Automatic UI refresh ✓
  // Consistent error handling ✓
}`}</code></pre>
      </div>
    </div>
  </section>
</div>

<style>
  .migration-demo {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  header p {
    color: #666;
    font-size: 1.1rem;
  }
  
  .status-bar {
    display: flex;
    gap: 2rem;
    justify-content: center;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .status-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .status-item .label {
    font-weight: 600;
    color: #666;
  }
  
  .status-item .value {
    padding: 0.25rem 0.75rem;
    background: #e0e0e0;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .status-item .value.connected {
    background: #4caf50;
    color: white;
  }
  
  .test-inputs {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  .test-inputs h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .input-group label {
    font-weight: 600;
    color: #333;
  }
  
  .input-group input {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
  }
  
  .input-group input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .system-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .system-card h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
  
  .features {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem;
  }
  
  .features li {
    padding: 0.5rem 0;
    padding-left: 1.5rem;
    position: relative;
  }
  
  .features li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
  }
  
  .test-button {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .test-button.old {
    background: #ff6b6b;
    color: white;
  }
  
  .test-button.old:hover {
    background: #ff5252;
    transform: translateY(-2px);
  }
  
  .test-button.new {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .test-button.new:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
  }
  
  .component-demo {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  .component-demo h2 {
    margin-top: 0;
  }
  
  .demo-area {
    display: flex;
    justify-content: center;
    padding: 2rem;
    background: #f5f5f5;
    border-radius: 8px;
    min-height: 100px;
    align-items: center;
  }
  
  .hint {
    color: #999;
    font-style: italic;
  }
  
  .results {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .results-header h2 {
    margin: 0;
  }
  
  .clear-button {
    padding: 0.5rem 1rem;
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .clear-button:hover {
    background: #ff5252;
  }
  
  .results-grid {
    display: grid;
    gap: 1rem;
  }
  
  .result-card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s;
  }
  
  .result-card.success {
    border-color: #4caf50;
    background: #f1f8f4;
  }
  
  .result-card.error {
    border-color: #ff6b6b;
    background: #fff5f5;
  }
  
  .result-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .system-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .system-badge.old {
    background: #ff6b6b;
    color: white;
  }
  
  .system-badge.new {
    background: #667eea;
    color: white;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .status-badge.success {
    background: #4caf50;
    color: white;
  }
  
  .status-badge:not(.success) {
    background: #ff6b6b;
    color: white;
  }
  
  .result-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .detail-row {
    display: flex;
    gap: 0.5rem;
  }
  
  .detail-row .label {
    font-weight: 600;
    color: #666;
  }
  
  details {
    margin-top: 1rem;
  }
  
  summary {
    cursor: pointer;
    font-weight: 600;
    color: #667eea;
    user-select: none;
  }
  
  summary:hover {
    text-decoration: underline;
  }
  
  pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  
  .notifications {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  .notifications h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  
  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .notification-card {
    border: 2px solid #667eea;
    border-radius: 8px;
    padding: 1rem;
    background: #f8f9ff;
  }
  
  .notification-header {
    margin-bottom: 0.5rem;
  }
  
  .timestamp {
    font-weight: 600;
    color: #667eea;
  }
  
  .migration-guide {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .migration-guide h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  
  .code-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .code-block h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .code-block pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1.5rem;
    border-radius: 8px;
    overflow-x: auto;
  }
  
  .code-block code {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
  }
  
  @media (max-width: 768px) {
    .comparison,
    .code-comparison {
      grid-template-columns: 1fr;
    }
  }
</style>
