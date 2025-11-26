<script lang="ts">
  /**
   * Task Approval Button Component
   * 
   * This component demonstrates migrating from the old sendToSer system
   * to the new unified action system for task approval operations.
   * 
   * OLD WAY (commented out for reference):
   * import { sendToSer } from '$lib/send/sendToSer.js';
   * await sendToSer(
   *   { id: taskId, myIshur: true, projectId: projectId },
   *   '31updateTask',
   *   null,
   *   null,
   *   false,
   *   fetch
   * );
   * 
   * NEW WAY:
   * import { updateTask } from '$lib/client/actionClient';
   * await updateTask({ id: taskId, projectId: projectId, myIshur: true });
   */
  
  import { updateTask, displayActionSuccess, displayActionError } from '$lib/client/actionClient';
  import type { ActionResponse } from '$lib/client/actionClient';
  import { lang } from '$lib/stores/lang.js';
  
  interface Props {
    taskId: string;
    projectId: string;
    taskName?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }
  
  let {
    taskId,
    projectId,
    taskName = 'Task',
    onSuccess,
    onError
  }: Props = $props();
  
  let loading = $state(false);
  let approved = $state(false);
  
  const labels = {
    approve: { he: 'אישור', en: 'Approve' },
    approving: { he: 'מאשר...', en: 'Approving...' },
    approved: { he: 'אושר', en: 'Approved' },
    successMessage: { he: 'המשימה אושרה בהצלחה!', en: 'Task approved successfully!' }
  };
  
  async function handleApprove() {
    if (loading || approved) return;
    
    loading = true;
    
    try {
      // NEW SYSTEM: Using the unified action client
      const response: ActionResponse = await updateTask({
        id: taskId,
        projectId: projectId,
        myIshur: true
      }, {
        showSuccessToast: true,
        successMessage: labels.successMessage[$lang],
        showErrorToast: true,
        onSuccess: (data) => {
          console.log('Task approved successfully:', data);
          approved = true;
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Failed to approve task:', error);
          onError?.(error);
        }
      });
      
      // The update strategy will automatically refresh arr1 data
      // No manual refresh needed!
      
    } catch (error) {
      console.error('Unexpected error:', error);
      displayActionError(error);
      onError?.(error);
    } finally {
      loading = false;
    }
  }
  
  /* OLD SYSTEM (for comparison):
  async function handleApproveOld() {
    if (loading || approved) return;
    
    loading = true;
    
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
      
      if (result?.data?.updateAct?.data) {
        approved = true;
        // Manual notification handling would be needed here
        // Manual UI refresh would be needed here
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to approve task:', error);
      onError?.(error);
    } finally {
      loading = false;
    }
  }
  */
</script>

<button
  onclick={handleApprove}
  disabled={loading || approved}
  class="task-approval-button"
  class:loading
  class:approved
  aria-label={labels.approve[$lang]}
>
  {#if approved}
    <svg class="icon checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
    <span>{labels.approved[$lang]}</span>
  {:else if loading}
    <svg class="icon spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
    </svg>
    <span>{labels.approving[$lang]}</span>
  {:else}
    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
    <span>{labels.approve[$lang]}</span>
  {/if}
</button>

<style>
  .task-approval-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .task-approval-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .task-approval-button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .task-approval-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .task-approval-button.approved {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
  
  .task-approval-button.loading {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  
  .icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  .checkmark {
    animation: checkmark 0.5s ease-in-out;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes checkmark {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
