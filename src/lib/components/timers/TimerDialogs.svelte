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
  import {
    normalizeSaveLink,
    normalizeSaveLinks,
    saveLinkLabel,
    SAVE_LINKS_MAX
  } from '$lib/timers/saveLinks';
  import { readSaveFiles, fileSizeLabel } from '$lib/timers/saveFiles';
  import { mediaUrl } from '$lib/utils/processLifecycle';
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

  // Which acts this timer's hours are attributed to.
  //
  // Seeded here, from the timer itself, rather than trusting every caller to do
  // it: an empty list is no longer "no opinion" on save, it is "unlink them
  // all", so a dialog that opened with every box unticked would quietly drop
  // the acts the member had linked. `timer.svelte` seeds its own copy and finds
  // this a no-op; `ProTimerRow` does not, and used to lose them.
  let seededTasksFor = null;
  $effect(() => {
    const active = timer?.attributes?.activeTimer?.data;
    const timerId = active?.id ?? null;
    const acts = active?.attributes?.acts?.data;
    untrack(() => {
      // Once per timer: re-running after the member unticks a box would put
      // it straight back.
      if (timerId == null || seededTasksFor === timerId) return;
      seededTasksFor = timerId;
      if (selectedTasks.length) return;
      if (acts?.length) selectedTasks = acts.map((task) => task.id);
    });
  });

  // ── Evidence: the links and files that go with the note ────────────────────
  // A sentence is often not the account of the work — the account is a PR, a
  // document, a recording, a file. Both ride with `saveText` into the timer,
  // and from there into the approval the rikma signs (files are copied onto the
  // Finiapruval's own media so the card can show them; links stay on the timer,
  // which the approval points at).
  /** @type {string[]} */
  let links = $state([]);
  /** @type {{id: string, url: string, name: string, mime: string, size: number}[]} */
  let files = $state([]);
  let linkDraft = $state('');
  let evidenceError = $state('');
  let uploading = $state(false);
  let evidenceTouched = $state(false);
  /** @type {HTMLInputElement|null} */
  let fileInput = $state(null);

  // Same rule as the note: seed from the timer, never over what the member is
  // in the middle of attaching.
  $effect(() => {
    const attrs = timer?.attributes?.activeTimer?.data?.attributes;
    if (!attrs) return;
    untrack(() => {
      if (evidenceTouched) return;
      if (!links.length) {
        const stored = normalizeSaveLinks(attrs.saveLinks);
        if (stored.length) links = stored;
      }
      if (!files.length) {
        const stored = readSaveFiles(attrs.saveFiles);
        if (stored.length) files = stored;
      }
    });
  });

  function addLink() {
    const link = normalizeSaveLink(linkDraft);
    if (!link) {
      evidenceError = $t('timers.attachLinkInvalid');
      return;
    }
    if (links.includes(link)) {
      linkDraft = '';
      return;
    }
    // normalizeSaveLinks is the one that knows the column's width, so ask it
    // rather than counting characters here: if it refuses the new list, the
    // link does not fit and the member is told instead of losing it silently.
    const next = normalizeSaveLinks([...links, link]);
    if (!next.includes(link)) {
      evidenceError = $t('timers.attachLinkFull', { count: SAVE_LINKS_MAX });
      return;
    }
    links = next;
    linkDraft = '';
    evidenceError = '';
    evidenceTouched = true;
  }

  /** @param {KeyboardEvent} event */
  function onLinkKey(event) {
    if (event.key !== 'Enter') return;
    // Enter inside the dialog would otherwise submit/close it.
    event.preventDefault();
    addLink();
  }

  /** @param {string} link */
  function removeLink(link) {
    links = links.filter((l) => l !== link);
    evidenceTouched = true;
  }

  /** @param {Event} event */
  async function onFilePick(event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);
    const picked = [...(input.files ?? [])];
    if (!picked.length) return;

    uploading = true;
    evidenceError = '';
    try {
      const fd = new FormData();
      for (const file of picked) fd.append('files', file);
      const resp = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!resp.ok) {
        // /api/upload answers 413/415 with the reason (too big, wrong type);
        // it is the only thing that can tell the member which file failed.
        const detail = await resp.json().catch(() => null);
        evidenceError = detail?.message || $t('timers.attachFileFailed');
        return;
      }
      const uploaded = await resp.json();
      const added = readSaveFiles(uploaded);
      files = [...files, ...added.filter((f) => !files.some((k) => k.id === f.id))];
      evidenceTouched = true;
    } catch (error) {
      console.error('[TimerDialogs] attachment upload failed', error);
      evidenceError = $t('timers.attachFileFailed');
    } finally {
      uploading = false;
      // Let the same file be picked again after a failure.
      input.value = '';
    }
  }

  /** @param {string} id */
  function removeFile(id) {
    // Only detached from this timer — the uploaded file itself is left alone,
    // because an earlier save may already have filed it on an approval row.
    files = files.filter((file) => file.id !== id);
    evidenceTouched = true;
  }

  function resetEvidence() {
    links = [];
    files = [];
    linkDraft = '';
    evidenceError = '';
    evidenceTouched = false;
    if (fileInput) fileInput.value = '';
  }

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
      {
        selectedTaskIds,
        saveText: saveText.trim(),
        saveLinks: links,
        saveFiles: files.map((file) => file.id)
      },
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
          timer?.attributes?.activeTimer?.data?.attributes?.acts?.data?.map(
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

    // Always an array: the list the member is looking at *is* their answer, so
    // unticking everything has to reach the server as "no acts" rather than as
    // "no opinion". saveTimer only omits the field when it is handed null.
    const tasksToSave = Array.isArray(selectedTasks) ? selectedTasks : [];

    const result = await saveTimer(
      timer,
      timer.mId,
      fetch,
      false,
      tasksToSave,
      timer.projectId,
      page.data.uid,
      saveText,
      { links, files: files.map((file) => file.id) }
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
      resetEvidence();
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
  // The acts this timer's hours can be attributed to: every act still open on
  // *this member's own* mission-in-progress.
  //
  // This list used to also require `myIshur` — the assignee's acceptance —
  // which is a flag nothing sets on an act that was never assigned to an
  // individual (an act opened on the mission itself, one opened to a role, one
  // that came in through the external Tasks API) and that legacy rows carry as
  // NULL. On those missions the whole chooser vanished: the section is drawn
  // `{#if …length}`, so an empty filter reads as "this mission has no tasks".
  // Acceptance is about who owes the work, not about which act an hour belongs
  // to, so it is no longer asked here; `naasa` (already reported done) is.
  let linkableTasks = $derived(
    timer?.attributes?.acts?.data?.filter((task) => !task.attributes?.naasa) ?? []
  );
  let filteredTasks = $derived(
    linkableTasks.filter((task) =>
      (task.attributes?.shem ?? '')
        .toLowerCase()
        .includes(taskSearchTerm.toLowerCase())
    )
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
        {#if linkableTasks.length}
          <h3>{$t('timers.chooseTasks')}</h3>
          <div class="task-selection">
            <input
              type="text"
              bind:value={taskSearchTerm}
              placeholder={$t('timers.searchTasks')}
              class="task-search"
            />

            <div class="task-list d">
              {#each filteredTasks as task (task.id)}
                <label class="task-item">
                  <input
                    type="checkbox"
                    bind:group={selectedTasks}
                    value={task.id}
                  />
                  <span>{task.attributes.shem}</span>
                </label>
              {:else}
                <!-- The search, not the mission, is what emptied the list —
                     say so instead of leaving a blank box that reads like
                     "you have no tasks". -->
                <p class="task-empty">{$t('timers.noTasksMatch')}</p>
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

        <!-- Links and files: the part of the account a sentence cannot carry. -->
        <div class="save-evi">
          <span class="save-note-label">{$t('timers.attachTitle')}</span>
          <p class="save-evi-hint">{$t('timers.attachHint')}</p>

          <div class="save-evi-row">
            <input
              id="timer-save-link"
              class="save-evi-input"
              type="url"
              inputmode="url"
              bind:value={linkDraft}
              onkeydown={onLinkKey}
              placeholder={$t('timers.attachLinkPlaceholder')}
              aria-label={$t('timers.attachLinkLabel')}
            />
            <button
              type="button"
              class="save-evi-add"
              onclick={addLink}
              disabled={!linkDraft.trim() || links.length >= SAVE_LINKS_MAX}
            >
              {$t('timers.attachLinkAdd')}
            </button>
          </div>

          {#if links.length}
            <ul class="save-evi-list">
              {#each links as link (link)}
                <li class="save-evi-chip">
                  <a href={link} target="_blank" rel="noopener noreferrer">{saveLinkLabel(link)}</a>
                  <button
                    type="button"
                    class="save-evi-drop"
                    onclick={() => removeLink(link)}
                    aria-label={$t('timers.attachRemove')}
                    title={$t('timers.attachRemove')}>×</button
                  >
                </li>
              {/each}
            </ul>
          {/if}

          <div class="save-evi-row">
            <input
              bind:this={fileInput}
              id="timer-save-file"
              class="save-evi-file"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={uploading}
              onchange={onFilePick}
              aria-label={$t('timers.attachFileLabel')}
            />
            {#if uploading}
              <span class="save-evi-busy">{$t('timers.attachUploading')}</span>
            {/if}
          </div>

          {#if files.length}
            <ul class="save-evi-list">
              {#each files as file (file.id)}
                <li class="save-evi-chip">
                  <a href={mediaUrl(file.url)} target="_blank" rel="noopener noreferrer">
                    {file.name}
                    {#if file.size}<span class="save-evi-size">{fileSizeLabel(file.size)}</span>{/if}
                  </a>
                  <button
                    type="button"
                    class="save-evi-drop"
                    onclick={() => removeFile(file.id)}
                    aria-label={$t('timers.attachRemove')}
                    title={$t('timers.attachRemove')}>×</button
                  >
                </li>
              {/each}
            </ul>
          {/if}

          {#if evidenceError}
            <p class="save-evi-error" role="alert">{evidenceError}</p>
          {/if}
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

  /* ── Evidence: links + files, on the dialog's own dark glass ───────────── */
  .save-evi {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.9rem;
  }

  .save-evi-hint {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .save-evi-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .save-evi-input {
    flex: 1 1 12rem;
    min-width: 0;
    padding: 0.45rem 0.55rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
    font: inherit;
    /* A URL is always LTR, even inside the RTL dialog. */
    direction: ltr;
    text-align: start;
  }

  .save-evi-input::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  .save-evi-input:focus {
    outline: none;
    border-color: #00ffff;
  }

  .save-evi-add {
    padding: 0.45rem 0.8rem;
    border-radius: 6px;
    border: 1px solid rgba(0, 255, 255, 0.5);
    background: rgba(0, 255, 255, 0.12);
    color: #00ffff;
    font: inherit;
    cursor: pointer;
  }

  .save-evi-add:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .save-evi-file {
    flex: 1 1 12rem;
    min-width: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .save-evi-file::file-selector-button {
    margin-inline-end: 0.5rem;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font: inherit;
    cursor: pointer;
  }

  .save-evi-busy {
    font-size: 0.75rem;
    color: #00ffff;
  }

  .save-evi-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .save-evi-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    max-width: 100%;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    font-size: 0.78rem;
  }

  .save-evi-chip a {
    max-width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #7ee0ff;
    text-decoration: underline;
  }

  .save-evi-size {
    margin-inline-start: 0.3rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .save-evi-drop {
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
  }

  .save-evi-drop:hover {
    color: #ff8fb1;
  }

  .save-evi-error {
    margin: 0;
    font-size: 0.78rem;
    color: #ffb4c6;
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

  .task-empty {
    opacity: 0.7;
    font-size: 0.9rem;
    padding: 0.25rem 0.5rem;
  }

  /* ── Business skin ──────────────────────────────────────────────────────
     The dialog's own palette is the personal theme's: a black→azure wash with
     cyan headings, neon-green and hot-pink gradient buttons. Opened off the
     business timers page it reads as a different product. Rather than
     re-authoring a thousand lines, this block repaints only what carries
     colour — off the same surface tokens the page uses — so the dialog lands
     in whichever theme the page around it is wearing.

     `.timer-dialog` is portaled to <body>, hence the :global() on the shell;
     everything inside it is ordinary markup of this component and keeps its
     scope class, so `:global(html.business) .x` is enough for the rest. */
  :global(html.business [data-svelte-dialog-content].timer-dialog) {
    background: var(--surface);
    color: var(--surface-ink);
    border: 1px solid var(--surface-line);
    border-radius: var(--radius-theme, 4px);
    box-shadow: var(--shadow-theme);
  }
  :global(html.business) .close-button {
    color: var(--surface-muted);
  }
  :global(html.business) .close-button:hover {
    background: var(--gold-dd);
    /* A quarter-turn on a close button is decoration, not feedback. */
    transform: none;
  }
  :global(html.business) .dialog-title {
    color: var(--surface-ink);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  :global(html.business) .dialog-message {
    font-size: 0.95rem;
    color: var(--surface-muted);
  }

  /* Buttons: one accent for the affirmative action, an outline for the rest.
     No gradients, no lift on hover. */
  :global(html.business) .save-btn,
  :global(html.business) .clear-btn,
  :global(html.business) .recalc-btn,
  :global(html.business) .clear-all-btn {
    border-radius: var(--radius-theme, 4px);
    font-weight: 600;
    background: transparent;
    border: 1px solid var(--border-g);
    color: var(--goldink);
  }
  :global(html.business) .save-btn {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: var(--gold);
  }
  :global(html.business) .clear-btn,
  :global(html.business) .clear-all-btn {
    border-color: var(--destructive);
    color: var(--destructive);
  }
  :global(html.business) .save-btn:hover,
  :global(html.business) .clear-btn:hover,
  :global(html.business) .recalc-btn:hover,
  :global(html.business) .clear-all-btn:hover {
    transform: none;
    filter: brightness(1.05);
  }

  /* Inputs and the note field. */
  :global(html.business) .save-note-label,
  :global(html.business) .save-evi-busy {
    color: var(--surface-muted);
  }
  :global(html.business) .save-note-input,
  :global(html.business) .save-evi-input,
  :global(html.business) .task-search {
    background: var(--surface-2);
    border: 1px solid var(--input, var(--surface-line));
    color: var(--surface-ink);
  }
  :global(html.business) .save-note-input::placeholder,
  :global(html.business) .save-evi-input::placeholder {
    color: var(--surface-muted);
  }
  :global(html.business) .save-note-input:focus,
  :global(html.business) .save-evi-input:focus {
    border-color: var(--barbi-pink);
  }
  :global(html.business) .save-note-count,
  :global(html.business) .save-evi-hint,
  :global(html.business) .save-evi-size,
  :global(html.business) .save-evi-file,
  :global(html.business) .save-evi-drop {
    color: var(--surface-muted);
  }
  :global(html.business) .save-evi-add {
    background: transparent;
    border-color: var(--border-g);
    color: var(--goldink);
  }
  :global(html.business) .save-evi-file::file-selector-button {
    background: var(--surface-2);
    border-color: var(--input, var(--surface-line));
    color: var(--surface-ink);
  }
  :global(html.business) .save-evi-chip {
    background: var(--surface-2);
    border-color: var(--surface-line);
  }
  :global(html.business) .save-evi-chip a {
    color: var(--goldink);
  }
  :global(html.business) .save-evi-drop:hover,
  :global(html.business) .save-evi-error {
    color: var(--destructive);
  }

  /* The act picker. */
  :global(html.business) .task-item {
    background: var(--surface-2);
    border: 1px solid var(--surface-line);
    border-radius: var(--radius-theme, 4px);
  }
  :global(html.business) .task-item:hover {
    border-color: var(--barbi-pink);
    background: var(--surface-2);
  }
</style>
