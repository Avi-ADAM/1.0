<script>
  import { createBubbler, stopPropagation } from 'svelte/legacy';

  const bubble = createBubbler();
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    
    const dispatch = createEventDispatcher();
    
  /**
   * @typedef {Object} Props
   * @property {boolean} [isOpen]
   * @property {string} [title]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { isOpen = false, title = '', children } = $props();
  
    function closeModal() {
      dispatch('close');
    }
  </script>
  
  {#if isOpen}
    <div class="modal-overlay" onclick={closeModal} transition:fade={{ duration: 200 }}>
      <div class="modal-content" onclick={stopPropagation(bubble('click'))}>
        <div class="modal-header">
          <h2>{title}</h2>
          <button class="close-button" onclick={closeModal}>&times;</button>
        </div>
        <div class="modal-body">
          {@render children?.()}
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
    .modal-content {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      height: 90vh;
      overflow-y: auto;
    }
  
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
  
    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }
  </style>