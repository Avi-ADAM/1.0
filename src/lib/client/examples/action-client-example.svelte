<script lang="ts">
  /**
   * Example Component: Using the Action Client
   * 
   * This component demonstrates various ways to use the action client
   * for executing server actions from Svelte components.
   */
  
  import { updateTask, displayActionError, displayActionSuccess } from '$lib/client/actionClient';
  import type { ActionResponse } from '$lib/client/actionClient';
  
  // Example data
  let taskId = '123';
  let projectId = '456';
  let loading = false;
  let result: ActionResponse | null = null;
  
  // Example 1: Simple action execution
  async function handleSimpleApprove() {
    loading = true;
    
    const response = await updateTask({
      id: taskId,
      projectId: projectId,
      myIshur: true
    });
    
    loading = false;
    result = response;
  }
  
  // Example 2: With user feedback
  async function handleApproveWithFeedback() {
    loading = true;
    
    await updateTask({
      id: taskId,
      projectId: projectId,
      myIshur: true
    }, {
      showSuccessToast: true,
      successMessage: 'Task approved successfully!',
      showErrorToast: true
    });
    
    loading = false;
  }
  
  // Example 3: With callbacks
  async function handleApproveWithCallbacks() {
    loading = true;
    
    await updateTask({
      id: taskId,
      projectId: projectId,
      myIshur: true
    }, {
      onSuccess: (data) => {
        console.log('Success! Task data:', data);
        displayActionSuccess('Task approved!');
      },
      onError: (error) => {
        console.error('Error:', error);
        if (error.code === 'UNAUTHORIZED') {
          alert('You need permission to approve tasks');
        } else {
          displayActionError(error);
        }
      }
    });
    
    loading = false;
  }
  
  // Example 4: Manual update strategy
  async function handleApproveManual() {
    loading = true;
    
    const response = await updateTask({
      id: taskId,
      projectId: projectId,
      myIshur: true
    }, {
      skipUpdateStrategy: true  // Don't apply automatic updates
    });
    
    if (response.success) {
      // Manually handle the update
      console.log('Task updated, refreshing UI manually...');
      // You could update stores, invalidate data, etc.
    }
    
    loading = false;
  }
  
  // Example 5: Assign multiple users
  async function handleAssignUsers() {
    loading = true;
    
    const response = await updateTask({
      id: taskId,
      projectId: projectId,
      isAssigned: true,
      uid: ['user1', 'user2', 'user3']
    }, {
      showSuccessToast: true,
      successMessage: 'Users assigned to task!'
    });
    
    loading = false;
    result = response;
  }
  
  // Example 6: Update multiple fields
  async function handleCompleteTask() {
    loading = true;
    
    const response = await updateTask({
      id: taskId,
      projectId: projectId,
      myIshur: true,
      valiIshur: true,
      isAssigned: true
    }, {
      showSuccessToast: true,
      successMessage: 'Task completed and approved!'
    });
    
    loading = false;
    result = response;
  }
</script>

<div class="action-client-examples">
  <h2>Action Client Examples</h2>
  
  <div class="inputs">
    <label>
      Task ID:
      <input type="text" bind:value={taskId} />
    </label>
    
    <label>
      Project ID:
      <input type="text" bind:value={projectId} />
    </label>
  </div>
  
  <div class="examples">
    <section>
      <h3>Example 1: Simple Execution</h3>
      <p>Basic action execution without any options</p>
      <button on:click={handleSimpleApprove} disabled={loading}>
        {loading ? 'Loading...' : 'Approve Task (Simple)'}
      </button>
    </section>
    
    <section>
      <h3>Example 2: With User Feedback</h3>
      <p>Shows success/error toast notifications</p>
      <button on:click={handleApproveWithFeedback} disabled={loading}>
        {loading ? 'Loading...' : 'Approve Task (With Toast)'}
      </button>
    </section>
    
    <section>
      <h3>Example 3: With Callbacks</h3>
      <p>Custom success and error handling</p>
      <button on:click={handleApproveWithCallbacks} disabled={loading}>
        {loading ? 'Loading...' : 'Approve Task (With Callbacks)'}
      </button>
    </section>
    
    <section>
      <h3>Example 4: Manual Update Strategy</h3>
      <p>Skip automatic updates and handle manually</p>
      <button on:click={handleApproveManual} disabled={loading}>
        {loading ? 'Loading...' : 'Approve Task (Manual Update)'}
      </button>
    </section>
    
    <section>
      <h3>Example 5: Assign Multiple Users</h3>
      <p>Update array fields</p>
      <button on:click={handleAssignUsers} disabled={loading}>
        {loading ? 'Loading...' : 'Assign Users'}
      </button>
    </section>
    
    <section>
      <h3>Example 6: Update Multiple Fields</h3>
      <p>Update several fields at once</p>
      <button on:click={handleCompleteTask} disabled={loading}>
        {loading ? 'Loading...' : 'Complete Task'}
      </button>
    </section>
  </div>
  
  {#if result}
    <div class="result">
      <h3>Last Result:</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  {/if}
</div>

<style>
  .action-client-examples {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  h2 {
    margin-bottom: 2rem;
  }
  
  .inputs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .examples {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  section {
    border: 1px solid #e0e0e0;
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    margin-bottom: 1rem;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  button:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .result {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  
  pre {
    overflow-x: auto;
    padding: 1rem;
    background-color: #fff;
    border-radius: 4px;
  }
</style>
