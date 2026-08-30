<script lang="ts">
  import { untrack } from 'svelte';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import { lang } from '$lib/stores/lang';
  import { t, isRtl} from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { formatTime } from '$lib/func/uti/formatTime';
  import {
    handleClearAll,
    updateTimer,
    saveTimer,
    recalculateMissionHours,
    calculateTotalHours
  } from '$lib/func/timers.js';
  import { timers, updateTimers, lockTimerForEdit, unlockTimerForEdit } from '$lib/stores/timers';
  import { page } from '$app/state';
  // The interval list itself — shared with the global editor and the chat card.
  import TimeEditor from './TimeEditor.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} timer
   * @property {boolean} [showSaveDialog]
   * @property {boolean} [showClearDialog]
   * @property {boolean} [showSaveFinal]
   * @property {boolean} [dialogEdit]
   * @property {string} [elapsedTime]
   * @property {any} [selectedTasks]
   * @property {string} [taskSearchTerm]
   * @property {(payload: { timer: any, running: boolean, hoursdon?: any }) => void} [onUpdateTimer]
   */

  /** @type {Props} */
  let {
    timer = $bindable(),
    showSaveDialog = $bindable(false),
    showClearDialog = $bindable(false),
    showSaveFinal = $bindable(false),
    dialogEdit = $bindable(true),
    elapsedTime = $bindable('00:00:00'),
    selectedTasks = $bindable([]),
    taskSearchTerm = $bindable(''),
    onUpdateTimer
  } = $props();

  // The member's own account of what they did during this timer. It rides along
  // with the save into the timer, the approval vote and the finished-mission
  // row, so the rikma can read it in the moach next to the hours.
  // The note is copied into `why` on the approval / finished-mission row, a
  // 255-char Strapi string, so keep a single note comfortably inside it.
  const SAVE_TEXT_MAX = 240;
  let saveText = $state('');
  let saveTextTouched = $state(false);

  // Seed from whatever is already on the timer, but never stomp on what the
  // member is typing right now.
  $effect(() => {
    const stored = timer?.attributes?.activeTimer?.data?.attributes?.saveText;
    if (typeof stored !== 'string' || !stored) return;
    untrack(() => {
      if (!saveTextTouched && !saveText) saveText = stored;
    });
  });

  // The dialogs sit next to a card whose timer may not be in the store yet
  // (`fetchTimers` is async, and a failed refresh empties the store). Reading
  // `timer.mId` straight from a missing entry threw inside the click handler
  // and left the dialog stuck, so every lock/unlock goes through these.
  function lockThis() {
    if (timer?.mId != null) lockTimerForEdit(timer.mId);
  }
  function unlockThis() {
    if (timer?.mId != null) unlockTimerForEdit(timer.mId, { refresh: true });
  }

  // פונקציות
  function closeDialog() {
    showSaveDialog = false;
    dialogEdit = true;
    unlockThis();
  }

  function handleClearTimer() {
    showSaveDialog = false;
    showClearDialog = true;
    lockThis();
  }

  async function localClearAllTimers() {
    try {
      // Pass project and user IDs for the dedicated action
      const updatedActiveTimerData = await handleClearAll(timer, fetch, false, timer.projectId, page.data.uid);
      // Check the response: if valid, update the store and dispatch event.
      if (updatedActiveTimerData) {
        console.log(updatedActiveTimerData);
        // Update the global store with the result from handleClearAll
        updateTimers(
          $timers.map((t) =>
            t.mId === timer.mId
              ? {
                  ...t,
                  running: false, // Timer is stopped after clearing
                  attributes: {
                    ...t.attributes,
                    activeTimer: {
                      ...t.attributes.activeTimer,
                      data: updatedActiveTimerData, // Use the response from handleClearAll
                      isActive: false // Timer is inactive
                    }
                    // Assuming handleClearAll resets totalHours in the returned data,
                    // otherwise, you might need to adjust howmanyhoursalready here too.
                  }
                }
              : t
          )
        );

        // Call the callback prop
        onUpdateTimer?.({
          timer: updatedActiveTimerData, // Pass the updated active timer data
          running: false // Timer is not running
          // If handleClearAll also affects howmanyhoursalready, pass it:
          // hoursdon: updatedActiveTimerData.attributes.totalHours * 3600000 // Example if totalHours is reset
        });

        showClearDialog = false;
        unlockThis();
        toast.success($t('timers.clearSuccess'));
      } else {
        toast.error($t('timers.clearError'));
      }
    } catch (error) {
      console.error('Error clearing timers:', error);
      toast.error($t('timers.clearError'));
    }
  }

  async function handleUpdateTimer() {
    const selectedTaskIds = selectedTasks.map((taskId) => parseInt(taskId, 10));
    await updateTimer(
      timer.attributes.activeTimer.data,
      'tasks',
      { selectedTaskIds, saveText: saveText.trim() },
      fetch,
      timer.projectId,
      page.data.uid
    ).then((x) => {
      if (x) {
        onUpdateTimer?.({
          timer: x,
          running: false
        });

        showSaveFinal = false;
        showSaveDialog = false;
        dialogEdit = false;
        selectedTasks =
          timer?.attributes.activeTimer?.data?.attributes.acts.data.map(
            (task) => task.id
          ) ?? [];
        taskSearchTerm = '';
        unlockThis();
        toast.success($t('timers.timerUpdated'));
      }
    });
  }

  function handleSaveTimer() {
    showSaveDialog = false;
    showClearDialog = false;
    dialogEdit = true;
    showSaveFinal = true;
    lockThis();
  }

  async function handleSaveTimerFinal() {
    if (!timer?.attributes?.activeTimer?.data) {
      console.error('אין טיימר פעיל לשמור');
      return;
    }

    const tasksToSave =
      selectedTasks && selectedTasks.length > 0 ? selectedTasks : null;

    const result = await saveTimer(
      timer,
      timer.mId,
      fetch,
      false,
      tasksToSave,
      timer.projectId,
      page.data.uid,
      saveText
    );

    if (result) {
      console.log('טיימר נשמר בהצלחה', result);
      // The timerSave action answers with { success, missionId } — it carries
      // neither the timer nor the mission, so read both defensively. The
      // `refresh: true` unlock below is what brings the real state back.
      const hoursdon = result?.mission?.attributes?.howmanyhoursalready;
      onUpdateTimer?.({
        timer: result?.timer ?? null,
        running: false,
        ...(hoursdon !== undefined ? { hoursdon } : {})
      });

      showSaveFinal = false;
      showSaveDialog = false;
      dialogEdit = false;
      saveText = '';
      saveTextTouched = false;
      unlockThis();

      toast.success($t('timers.saveSuccess'));
    } else {
      toast.error($t('timers.saveError'));
    }
  }

  async function handleRecalculate() {
    if (!timer?.mId) {
      toast.error($t('timers.missingMissionId'));
      return;
    }

    const result = await recalculateMissionHours(timer.mId, fetch);

    if (result) {
      const { savedHours } = result;
      // Calculate unsaved hours from the current active timer data
      const currentTimers = timer?.attributes?.activeTimer?.data?.attributes?.timers || [];
      const unsavedHours = calculateTotalHours(currentTimers);
      const displayTotal = savedHours + unsavedHours;

      // Format for display
      toast.success(
        $t('common.misc.recalcDone', {
          saved: savedHours.toFixed(2),
          unsaved: unsavedHours.toFixed(2),
          total: displayTotal.toFixed(2)
        }),
        { duration: 5000 }
      );
    } else {
      toast.error($t('timers.recalcFailed'));
    }
  }
  // Computed properties
  let lastTimer = $derived(
    timer?.attributes?.activeTimer?.data?.attributes?.timers?.slice(-1)[0] ||
      null
  );
  let lastTimerDuration = $derived(
    lastTimer
      ? formatTime(
          lastTimer.stop
            ? new Date(lastTimer.stop).getTime() -
                new Date(lastTimer.start).getTime()
            : Date.now() - new Date(lastTimer.start).getTime(),
          { lang: $lang as 'he' | 'en' }
        )
      : ''
  );
  // With no timer on the mission there is no duration to name. The old code
  // dropped the English words "No timer available" into the middle of the
  // Hebrew sentence and still offered to save time that does not exist.
  let innerText = $derived(
    lastTimer
      ? $t('timers.stoppedAfter', { duration: lastTimerDuration })
      : $t('timers.noTimerYet')
  );
  let filteredTasks = $derived(
    timer?.attributes?.acts?.data?.filter(
      (task) =>
        !task.attributes.naasa &&
        task.attributes.myIshur &&
        task.attributes.shem
          .toLowerCase()
          .includes(taskSearchTerm.toLowerCase())
    ) || []
  );
</script>

<!--
  Layering. svelte-accessible-dialog portals its overlay to <body>, so these
  three dialogs compete with every other top-level layer in the app rather than
  with whatever card opened them. They used to declare z-index 700, which put
  them *under* the lev sheet — the fixed, opaque z-900 panel that both the coin
  view and the list view mount a card into (LevSheet.svelte). Opening the timer
  menu from a coin therefore did nothing visible: the dialog was there, behind
  the sheet, with the page scroll locked behind it. 1300 clears the sheet (900)
  and the card deck's own chrome (1000), and stays under the app's 9000+ layers.
-->

<!-- דיאלוג ניקוי -->
<DialogOverlay
  style="z-index: 1300;"
  isOpen={showClearDialog}
  onDismiss={() => { showClearDialog = false; unlockThis(); }}
>
  <div
    style="z-index: 1300;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent aria-label="clear-timer-options" class="timer-dialog">
      <button
        class="close-button"
        onclick={() => { showClearDialog = false; unlockThis(); }}
        aria-label="Close dialog"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div class="dialog-content mt-4" dir={$isRtl ? 'rtl' : 'ltr'}>
        {#if timer?.attributes?.activeTimer?.data}
          <!-- One editor, shared with the global dialog and the chat card.
               The interval list used to be re-implemented here, and its copy
               in the chat disagreed with it about what a valid interval is. -->
          <TimeEditor
            missionId={timer.mId}
            missionName={timer.missionName ?? timer?.attributes?.name ?? ''}
            timerId={timer.attributes.activeTimer.data.id}
            projectId={timer.projectId}
            intervals={timer.attributes.activeTimer.data.attributes.timers ?? []}
          />

          <div class="manage-actions">
            <button class="save-btn" onclick={handleSaveTimer}>
              {$t('timers.saveTimerBtn')}
            </button>
            <button class="recalc-btn" onclick={handleRecalculate}>
              {$t('timers.recalculate')}
            </button>
            <button
              class="clear-all-btn"
              onclick={() => localClearAllTimers()}
              aria-label={$t('timers.clearAll')}
            >
              {$t('timers.clearAll')}
            </button>
          </div>
        {:else}
          <p class="no-timers">{$t('timers.noTimes')}</p>
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- דיאלוג שמירה -->
<DialogOverlay
  style="z-index: 1300;"
  isOpen={showSaveDialog}
  onDismiss={() => closeDialog()}
>
  <div
    style="z-index: 1300;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent aria-label="timer-options" class="timer-dialog">
      <button
        class="close-button"
        onclick={closeDialog}
        aria-label="Close dialog"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div class="dialog-content mt-4" dir={$isRtl ? 'rtl' : 'ltr'}>
        <h2 class="dialog-title">
          {dialogEdit == true ? $t('timers.editTimer') : $t('timers.saveTimer')}
        </h2>
        <p class="dialog-message">
          {dialogEdit == true ? $t('timers.updateHint') : innerText}
        </p>
        <div class="dialog-buttons">
          <!-- Saving is the everyday action, so it sits on the first screen of
               the menu instead of one level in. On a phone the row only has
               space for two, and "update tasks" opens the very same dialog as
               "save timer" — so that is the one that gives way. -->
          <button class="save-btn" onclick={handleSaveTimer}>
            {$t('timers.saveTimerBtn')}
          </button>
          <!-- Correcting the logged times is its own labelled action now. It
               used to share a button with "clear timer" — the same control
               said "edit times" or "clear the timer" depending on how the
               dialog had been opened, which is why members could not find the
               editor and feared the button that led to it. -->
          <button class="clear-btn" onclick={handleClearTimer}>
            {$t('timers.editTimes')}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- דיאלוג שמירה סופי -->
<DialogOverlay
  style="z-index: 1300;"
  isOpen={showSaveFinal}
  onDismiss={() => { showSaveFinal = false; unlockThis(); }}
>
  <div style="z-index: 1300;" transition:fly={{ y: -100, duration: 500 }}>
    <DialogContent aria-label="timer-options" class="timer-dialog">
      <button
        class="close-button"
        onclick={() => { showSaveFinal = false; unlockThis(); }}
        aria-label="Close dialog"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div class="dialog-content mt-4" dir={$isRtl ? 'rtl' : 'ltr'}>
        <h2 class="dialog-title">{$t('timers.saveTimer')}</h2>
        {#if filteredTasks.length}
          <h3>{$t('timers.chooseTasks')}</h3>
          <div class="task-selection">
            <input
              type="text"
              bind:value={taskSearchTerm}
              placeholder={$t('timers.searchTasks')}
              class="task-search"
            />

            <div class="task-list d">
              {#each filteredTasks as task}
                <label class="task-item">
                  <input
                    type="checkbox"
                    bind:group={selectedTasks}
                    value={task.id}
                  />
                  <span>{task.attributes.shem}</span>
                </label>
              {/each}
            </div>
          </div>
        {/if}

        <div class="save-note">
          <label class="save-note-label" for="timer-save-note">
            {$t('timers.whatDidYouDo')}
          </label>
          <textarea
            id="timer-save-note"
            class="save-note-input"
            rows="3"
            maxlength={SAVE_TEXT_MAX}
            bind:value={saveText}
            oninput={() => (saveTextTouched = true)}
            placeholder={$t('timers.whatDidYouDoPlaceholder')}
          ></textarea>
          <span class="save-note-count">{saveText.length}/{SAVE_TEXT_MAX}</span>
        </div>

        {#if dialogEdit != true}
          <div class="time-summary">
            <p>{elapsedTime}</p>
          </div>
        {/if}
        <div class="dialog-buttons">
          <button
            class="px-4 py-2 rounded font-bold text-black bg-gradient-to-r from-green-400 to-blue-400 transform transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={handleSaveTimerFinal}
            disabled={elapsedTime === '00:00:00' && dialogEdit != true}
          >
            {$t('timers.saveTimerBtn')}
          </button>
          {#if filteredTasks.length > 0}
            <button
              class="px-4 py-2 rounded font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-400 transform transition-transform hover:-translate-y-1"
              onclick={handleUpdateTimer}
            >
              {$t('timers.update')}
            </button>
          {/if}
          <button
            class="px-4 py-2 rounded font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 transform transition-transform hover:-translate-y-1"
            onclick={handleClearTimer}
          >
            {$t('timers.clearTimer')}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
  /* There used to be a `:global(.svelte-dialog-overlay)` block here carrying
     `z-index: 700`. svelte-accessible-dialog marks its overlay with the
     *attribute* `data-svelte-dialog-overlay`, never that class, so the rule
     matched nothing and the 700 it declared was never the layer these dialogs
     actually got. The layer is the inline z-index on each <DialogOverlay>
     above — see the note there. */

  :global([data-svelte-dialog-content].timer-dialog) {
    background: linear-gradient(147deg, #000000 0%, #04619f 74%);
    padding: 2rem;
    border-radius: 12px;
    color: #fff;
    width: 90vw;
    max-width: 500px;
    position: relative;
    margin: 2rem auto;
    min-width: 320px;
    z-index: 1301;
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(90deg);
  }

  .close-button svg {
    width: 20px;
    height: 20px;
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
    flex-wrap: wrap;
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

  /* The menu is two buttons now — save, and edit the times — so both fit a
     phone. "Update tasks" was a third button that opened the very same dialog
     as "save timer"; it lives inside that dialog instead. */
  @media (max-width: 480px) {
    .save-btn,
    .clear-btn {
      padding: 0.75rem 1rem;
    }
  }

  .save-note {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .save-note-label {
    font-size: 0.95rem;
    color: #00ffff;
  }

  .save-note-input {
    width: 100%;
    resize: vertical;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
    font: inherit;
    line-height: 1.4;
  }

  .save-note-input::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  .save-note-input:focus {
    outline: none;
    border-color: #00ffff;
  }

  .save-note-count {
    align-self: flex-end;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.55);
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

  /* The three whole-timer actions that sit under the interval list: send the
     hours for approval, recompute the mission's total, wipe the timer. */
  .manage-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 1rem;
  }

  .recalc-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: bold;
    background: linear-gradient(to right, #f59e0b, #ef4444);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .recalc-btn:hover {
    transform: translateY(-2px);
  }

  .clear-all-btn {
    padding: 0.5rem 1rem;
    background: linear-gradient(45deg, #ff3366, #ff0066);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .clear-all-btn:hover {
    transform: translateY(-2px);
  }

  .task-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .task-search {
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    cursor: pointer;
  }

  .task-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
