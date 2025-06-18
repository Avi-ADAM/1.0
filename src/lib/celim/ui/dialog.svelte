<script>
    //jsdoc format docomentation
    /**
     * @file dialog.svelte
     * @module dialog
     * @description This is a dialog component that is used to display a dialog box with a message and two buttons.
     * @requires svelte-accessible-dialog
     * @requires svelte
     * @requires svelte/transition
     * @requires $lib/stores/lang
     * @exports showSaveDialog
     * @exports dialogHeader
     * @exports innerText
     * @exports innerDialogButton
     * @exports clearButton
     * @exports handleSaveButton
     * @exports handleCancelButton
     * @exports closeDialog
     */
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import { lang } from '$lib/stores/lang';
    const dispatch = createEventDispatcher();
  /**
   * @typedef {Object} Props
   * @property {boolean} [showSaveDialog]
   * @property {any} [dialogHeader]
   * @property {any} [innerText]
   * @property {any} [innerDialogButton]
   * @property {any} [clearButton]
   */

  /** @type {Props} */
  let {
    showSaveDialog = $bindable(false),
    dialogHeader = {
      en: 'Save Timer',
      he: 'שמור טיימר'
    },
    innerText = {
      en: 'Would you like to save this timer?',
      he: 'האם תרצה לשמור את הטיימר הזה?'
    },
    innerDialogButton = {
      en: 'Save',
      he: 'שמור'
    },
    clearButton = {
      en: 'Clear',
      he: 'נקה'
    }
  } = $props();
    function handleSaveButton() {
      dispatch('save-timer');
      closeDialog();
    }
    function handleCancelButton() {
        dispatch('clear-timer');
        closeDialog();
    }
    function closeDialog() {
        showSaveDialog = false;
    }
</script>

<DialogOverlay 
  style="z-index: 700;" 
  isOpen={showSaveDialog} 
  onDismiss={closeDialog}
>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent
      aria-label="timer-options"
      class="timer-dialog"
    >
      <div class="dialog-content" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
        <h2 class="dialog-title">{dialogHeader[$lang]}</h2>
        <p class="dialog-message">
          {innerText[$lang]}
        </p>
        <div class="dialog-buttons">
          <button
            class="save-btn"
            onclick={handleSaveButton}
          >
            {innerDialogButton[$lang]}
          </button>
          <button
            class="clear-btn"
            onclick={handleCancelButton}
          >
            {clearButton[$lang]}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
    :global([data-svelte-dialog-content].timer-dialog) {
   background: linear-gradient(147deg, #000000 0%, #04619f 74%);
   padding: 2rem;
   border-radius: 12px;
   color: #fff;
   width: 90vw;
   max-width: 500px;
 }

 .dialog-content {
   display: flex;
   flex-direction: column;
   gap: 1.5rem;
 }

 .dialog-title {
   font-size: 1.5rem;
   font-weight: bold;
   color: #00ffff;
 }

 .dialog-message {
   font-size: 1.1rem;
   line-height: 1.5;
 }

 .dialog-buttons {
   display: flex;
   justify-content: flex-end;
   gap: 1rem;
 }

 .save-btn,
 .clear-btn {
   padding: 0.75rem 1.5rem;
   border: none;
   border-radius: 6px;
   font-weight: bold;
   cursor: pointer;
   transition: transform 0.2s;
 }

 .save-btn {
   background: linear-gradient(45deg, #00ff88, #00bbff);
   color: #000;
 }

 .clear-btn {
   background: linear-gradient(45deg, #ff3366, #ff0066);
   color: #fff;
 }

 .save-btn:hover,
 .clear-btn:hover {
   transform: translateY(-2px);
 }
</style>