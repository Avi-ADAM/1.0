<script lang="ts">
  import { untrack } from 'svelte';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { lang } from '$lib/stores/lang';
  import { t, isRtl} from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { formatTime } from '$lib/func/uti/formatTime';
  import {
    handleClearAll,
    handleClearSingle,
    updateTimer,
    saveTimer,
    recalculateMissionHours,
    calculateTotalHours
  } from '$lib/func/timers.js';
  import { timers, updateTimers, lockTimerForEdit, unlockTimerForEdit } from '$lib/stores/timers';
  import { page } from '$app/state';

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

  // פונקציות
  function closeDialog() {
    showSaveDialog = false;
    dialogEdit = true;
    unlockTimerForEdit(timer.mId, { refresh: true });
  }

  function handleClearTimer() {
    showSaveDialog = false;
    showClearDialog = true;
    lockTimerForEdit(timer.mId);
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
        unlockTimerForEdit(timer.mId, { refresh: true });
        toast.success($t('timers.clearSuccess'));
      } else {
        toast.error($t('timers.clearError'));
      }
    } catch (error) {
      console.error('Error clearing timers:', error);
      toast.error($t('timers.clearError'));
    }
  }
  async function localHandleClearSingle(i, timer) {
    const originalTimer = JSON.parse(JSON.stringify(timer));
    const originalTimers = [
      ...timer.attributes.activeTimer.data.attributes.timers
    ];

    timer.attributes.activeTimer.data.attributes.timers =
      timer.attributes.activeTimer.data.attributes.timers.filter(
        (_, index) => index !== i
      );

    try {
      const x = await handleClearSingle(i, originalTimer, fetch, false, timer.projectId, page.data.uid);
      if (x) {
        onUpdateTimer?.({
          timer: x,
          running: false
        });
      }
    } catch (error) {
      console.error('Failed to delete timer:', error);
      timer.attributes.activeTimer.data.attributes.timers = originalTimers;
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
        unlockTimerForEdit(timer.mId, { refresh: true });
        toast.success($t('timers.timerUpdated'));
      }
    });
  }

  function handleSaveTimer() {
    showSaveDialog = false;
    showClearDialog = false;
    dialogEdit = true;
    showSaveFinal = true;
    lockTimerForEdit(timer.mId);
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
      unlockTimerForEdit(timer.mId, { refresh: true });

      toast.success($t('timers.saveSuccess'));
    } else {
      toast.error($t('timers.saveError'));
    }
  }

  // Add to your script section:
  let editingTimer = null;

  function handleStartEdit(index, timerEntry) {
    lockTimerForEdit(timer.mId);
    const updatedTimer = structuredClone($state.snapshot(timer));
    updatedTimer.attributes.activeTimer.data.attributes.timers =
      updatedTimer.attributes.activeTimer.data.attributes.timers.map((t, i) => {
        if (i === index) {
          return {
            ...t,
            isEditing: true,
            editStart: toLocalDatetimeString(t.start),
            editStop: t.stop ? toLocalDatetimeString(t.stop) : null
          };
        }
        return t;
      });
    timer = updatedTimer;
  }

  async function handleSaveEdit(index, timerEntry) {
    const originalTimer = JSON.parse(JSON.stringify(timer));

    try {
      // Get the old lap (before edit)
      const oldLap = {
        start: timer.attributes.activeTimer.data.attributes.timers[index].start,
        stop: timer.attributes.activeTimer.data.attributes.timers[index].stop
      };

      // Update the timer entry with new values
      const newLap = {
        start: new Date(timerEntry.editStart).toISOString(),
        stop: timerEntry.editStop
          ? new Date(timerEntry.editStop).toISOString()
          : null
      };

      if (newLap.stop && new Date(newLap.stop) <= new Date(newLap.start)) {
        toast.error($lang === 'he' ? 'שעת הסוף חייבת להיות אחרי שעת ההתחלה' : 'End time must be after start time');
        return;
      }

      timer.attributes.activeTimer.data.attributes.timers[index] = {
        ...timerEntry,
        ...newLap,
        isEditing: false
      };

      // API call to update the timer with project and user context
      await updateTimer(
        timer.attributes.activeTimer.data, // Timer object
        'timers', // Specify what to update
        { oldLap, newLap, index }, // Pass oldLap, newLap, and index
        fetch, // Fetch function
        timer.projectId,
        page.data.uid
      );

      // Update the store with the modified timer
      updateTimers($timers.map((t) => (t.mId === timer.mId ? timer : t)));
      unlockTimerForEdit(timer.mId, { refresh: true });
    } catch (error) {
      console.error('Failed to update timer:', error);
      // Rollback changes
      timer = originalTimer;
      unlockTimerForEdit(timer.mId, { refresh: true });
    }
  }

  function handleCancelEdit(index) {
    const updatedTimer = structuredClone($state.snapshot(timer));
    updatedTimer.attributes.activeTimer.data.attributes.timers[index].isEditing = false;
    timer = updatedTimer;
    
    // Check if any other timer entries are still editing
    const anyStillEditing = timer.attributes.activeTimer.data.attributes.timers.some(
      (t, i) => i !== index && t.isEditing
    );
    if (!anyStillEditing) {
      unlockTimerForEdit(timer.mId, { refresh: true });
    }
  }

  async function handleAddInterval() {
    const now = new Date();
    const newInterval = {
      start: now.toISOString(),
      stop: now.toISOString(),
      isEditing: true,
      editStart: toLocalDatetimeString(now.toISOString()),
      editStop: toLocalDatetimeString(now.toISOString())
    };

    const updatedTimer = structuredClone($state.snapshot(timer));
    updatedTimer.attributes.activeTimer.data.attributes.timers.push(newInterval);
    timer = updatedTimer;

    // Update the store
    updateTimers($timers.map((t) => (t.mId === timer.mId ? timer : t)));
  }
  function toLocalDatetimeString(date) {
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().slice(0, 16);
  }

  async function handleRecalculate() {
    if (!timer?.mId) {
      toast.error(
        $lang === 'he' ? 'שגיאה: חסר מזהה משימה' : 'Error: Missing Mission ID'
      );
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
      toast.error($lang === 'he' ? 'חישוב נכשל' : 'Recalculation failed');
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

<!-- דיאלוג ניקוי -->
<DialogOverlay
  style="z-index: 700;"
  isOpen={showClearDialog}
  onDismiss={() => { showClearDialog = false; unlockTimerForEdit(timer.mId, { refresh: true }); }}
>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent aria-label="clear-timer-options" class="timer-dialog">
      <button
        class="close-button"
        onclick={() => { showClearDialog = false; unlockTimerForEdit(timer.mId, { refresh: true }); }}
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
        <h2 class="dialog-title">{$t('timers.manageTime')}</h2>

        {#if timer?.attributes?.activeTimer?.data?.attributes?.timers?.length}
          <div class="timer-list d">
            {#each timer.attributes.activeTimer.data.attributes.timers as timerEntry, i (timerEntry.start)}
              <div
                class="timer-entry"
                transition:slide={{
                  delay: 150,
                  duration: 1000,
                  easing: quintOut
                }}
              >
                <div class="timer-info">
                  {#if timerEntry.isEditing}
                    <div class="edit-fields">
                      <input
                        type="datetime-local"
                        bind:value={timerEntry.editStart}
                        class="datetime-input"
                      />
                      <!--TODO: add js code to prevent selecting before start -->
                      <input
                        type="datetime-local"
                        bind:value={timerEntry.editStop}
                        class="datetime-input"
                        min={timerEntry.editStart}
                        disabled={!timerEntry.stop}
                      />
                      <div class="edit-actions">
                        <button
                          class="save-edit-btn"
                          onclick={() => handleSaveEdit(i, timerEntry)}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path
                              fill="currentColor"
                              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                            />
                          </svg>
                        </button>
                        <button
                          class="cancel-edit-btn"
                          onclick={() => handleCancelEdit(i)}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path
                              fill="currentColor"
                              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  {:else}
                    <span class="timer-time">
                      {new Date(timerEntry.start).toLocaleString($lang)} -
                      {timerEntry.stop
                        ? new Date(timerEntry.stop).toLocaleString()
                        : 'Running'}
                    </span>
                    <span class="timer-duration">
                      {formatTime(
                        timerEntry.stop
                          ? new Date(timerEntry.stop).getTime() -
                              new Date(timerEntry.start).getTime()
                          : Date.now() - new Date(timerEntry.start).getTime(),
                        { lang: $lang as 'he' | 'en' }
                      )}
                    </span>
                  {/if}
                </div>
                <div class="timer-actions">
                  {#if !timerEntry.isEditing}
                    <button
                      class="edit-btn"
                      onclick={() => handleStartEdit(i, timerEntry)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                          fill="currentColor"
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                        />
                      </svg>
                    </button>
                    <button
                      class="clear-single-btn"
                      onclick={() => localHandleClearSingle(i, timer)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                          fill="currentColor"
                          d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                        />
                      </svg>
                    </button>
                  {/if}
                </div>
              </div>
            {/each}

            {#if timer?.attributes?.activeTimer?.data?.attributes?.timers}
              <button class="add-interval-btn" onclick={handleAddInterval}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                  />
                </svg>
                {$lang === 'he' ? 'הוספת מרווח זמן' : 'Add Time Interval'}
              </button>
            {/if}
          </div>

          <div
            class="additional-actions"
            style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;"
          >
            <button
              class="save-btn"
              style="background: linear-gradient(to right, #4ade80, #3b82f6); color: black;"
              onclick={handleSaveTimer}
            >
              {$t('timers.saveTimerBtn')}
            </button>
            <button
              class="recalc-btn"
              style="padding: 0.5rem 1rem; border-radius: 6px; font-weight: bold; background: linear-gradient(to right, #f59e0b, #ef4444); color: white; border: none; cursor: pointer;"
              onclick={handleRecalculate}
            >
              {$lang === 'he' ? 'חישוב מחדש' : 'Recalculate'}
            </button>
          </div>

          <button
            class="clear-all-btn"
            onclick={() => localClearAllTimers()}
            aria-label="Clear all timers"
          >
            {$t('timers.clearAll')}
          </button>
        {:else}
          <p class="no-timers">{$t('timers.noTimes')}</p>
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- דיאלוג שמירה -->
<DialogOverlay
  style="z-index: 700;"
  isOpen={showSaveDialog}
  onDismiss={() => closeDialog()}
>
  <div
    style="z-index: 700;"
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
          {#if dialogEdit == true}
            <button class="save-btn tasks-btn" onclick={handleSaveTimer}>
              {$t('timers.updateTasks')}
            </button>
          {/if}
          <button class="clear-btn" onclick={handleClearTimer}>
            {dialogEdit == true ? $t('timers.editTimes') : $t('timers.clearTimer')}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- דיאלוג שמירה סופי -->
<DialogOverlay
  style="z-index: 700;"
  isOpen={showSaveFinal}
  onDismiss={() => { showSaveFinal = false; unlockTimerForEdit(timer.mId, { refresh: true }); }}
>
  <div style="z-index: 700;" transition:fly={{ y: -100, duration: 500 }}>
    <DialogContent aria-label="timer-options" class="timer-dialog">
      <button
        class="close-button"
        onclick={() => { showSaveFinal = false; unlockTimerForEdit(timer.mId, { refresh: true }); }}
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
              placeholder={$lang === 'he'
                ? 'חיפוש משימות...'
                : 'Search tasks...'}
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
  :global(.svelte-dialog-overlay) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 700;
  }

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
    z-index: 701;
  }

  .edit-fields {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .datetime-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #fff;
    padding: 0.25rem;
    font-size: 0.9rem;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .save-edit-btn,
  .cancel-edit-btn {
    background: transparent;
    border: none;
    color: inherit;
    padding: 0.25rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-edit-btn {
    color: #00ff88;
  }

  .cancel-edit-btn {
    color: #ff3366;
  }

  .save-edit-btn:hover,
  .cancel-edit-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .timer-actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-btn {
    background: transparent;
    border: none;
    color: #00ffff;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background: rgba(0, 255, 255, 0.1);
    transform: scale(1.1);
  }

  .add-interval-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(45deg, #00ff88, #00bbff);
    border: none;
    border-radius: 6px;
    color: #000;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
    margin-top: 1rem;
  }

  .add-interval-btn:hover {
    transform: translateY(-2px);
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

  /* Three buttons do not fit a phone. "Update tasks" opens the same dialog as
     "save timer", so dropping it there costs the member nothing. */
  @media (max-width: 480px) {
    .tasks-btn {
      display: none;
    }

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

  .timer-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .timer-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .timer-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timer-time {
    font-size: 0.9rem;
    color: #ccc;
  }

  .timer-duration {
    font-weight: bold;
    color: #00ffff;
  }

  .timer-actions {
    display: flex;
    gap: 0.5rem;
  }

  .clear-single-btn {
    background: transparent;
    border: none;
    color: #ff3366;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-single-btn:hover {
    background: rgba(255, 51, 102, 0.1);
    transform: scale(1.1);
  }

  .clear-all-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(45deg, #ff3366, #ff0066);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
    margin-top: 1rem;
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
