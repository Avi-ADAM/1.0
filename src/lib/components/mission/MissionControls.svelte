<script>
  /**
   * MissionControls — everything the member who *owns* an in-progress mission
   * can do to it, in one strip: run/stop the timer, edit or save the logged
   * time, move the progress percentage and submit the mission for approval.
   *
   * It is the same set of actions the lev card offers
   * (`lev/cards/inpro.svelte` + `lev/missionInProgress.svelte`), lifted out of
   * the lev swiper so the moach progress board — the mission's actual home —
   * can offer them too without dragging the coin UI along.
   *
   * Timer state is read from and written to the global `$timers` store, the
   * single source of truth the lev page, the timers page and the socket
   * refresh all share, so a timer started here shows as running everywhere.
   * The host page is responsible for having filled that store
   * (`fetchTimers(uid, fetch)`); with no store entry for the mission the strip
   * renders a disabled hint instead of half-working buttons.
   */
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import { t, isRtl } from '$lib/translations';
  import { timers, updateTimers, lockTimerForEdit } from '$lib/stores/timers.js';
  import { startTimer, stopTimer } from '$lib/func/timers.js';
  import TimerDialogs from '$lib/components/timers/TimerDialogs.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import RangeSlider from 'svelte-range-slider-pips';
  import ArchiveObjectButton from '$lib/components/archive/ArchiveObjectButton.svelte';
  import ProposeEditButton from '$lib/components/archive/ProposeEditButton.svelte';
  import StipendButton from '$lib/components/stipend/StipendButton.svelte';

  /**
   * @typedef {Object} Props
   * @property {string|number} missionId - Mesimabetahalich id.
   * @property {string|number} projectId
   * @property {string} [missionName]
   * @property {number} [status] - current progress percentage (0–100).
   * @property {boolean} [pendingApproval] - a finish approval is already open.
   * @property {boolean} [compact] - icon-sized buttons for a dense table row.
   * @property {boolean} [isMine] - the viewer carries this mission. Off shows only the archive/edit
   *   proposal buttons (any rikma member may open those — see PLAN_OBJECT_ARCHIVAL); the
   *   timer/status/complete controls stay owner-only regardless of `showArchiveActions`.
   * @property {string} [ownerName] - who carries the mission, for the archive drawer's
   *   membership warning when the viewer isn't them.
   * @property {string|number|null} [ownerId] - who carries the mission. Lets the stipend
   *   dialog preselect the recipient when a *different* member offers to fund it.
   * @property {boolean} [showStipendAction] - offer "add a subsistence stipend" for a
   *   mission that already exists (PLAN_STIPEND §8). A stipend is not part of the
   *   mission's own terms — it is a separate agreement between two members about the
   *   same work — so it gets its own button rather than riding the edit proposal.
   * @property {boolean} [showArchiveActions] - offer "request update" / "propose to close" (PLAN_OBJECT_ARCHIVAL phase 4). Off by default — callers that don't have accrued-hours/terms data on hand should not show these.
   * @property {number} [accruedHours] - hours already logged (`howmanyhoursalready`).
   * @property {number|null} [hoursAssigned] - hours agreed for the mission (`hoursassinged`).
   * @property {number|null} [perhour] - hourly value agreed for the mission.
   * @property {(status: number) => void} [onStatus] - progress was saved.
   * @property {(outcome: 'approvalPending'|'completed') => void} [onCompleted] -
   *   the finish went through. `completed` means the server closed the mission
   *   outright (solo rikma — nobody left to approve); `approvalPending` means a
   *   finiapruval is now on the table.
   * @property {() => void} [onTimerSaved] - logged time changed on the server.
   */

  /** @type {Props} */
  let {
    missionId,
    projectId,
    missionName = '',
    status = 0,
    pendingApproval = false,
    compact = false,
    isMine = true,
    ownerName = '',
    ownerId = null,
    showArchiveActions = false,
    showStipendAction = true,
    accruedHours = 0,
    hoursAssigned = null,
    perhour = null,
    onStatus,
    onCompleted,
    onTimerSaved
  } = $props();

  /** The viewer, for the stipend dialog's funder/recipient preselection. */
  let myId = $derived(page.data?.uid != null ? String(page.data.uid) : '');

  // ── Timer state, derived from the store (same model as timers/timer.svelte) ──
  let storeTimer = $derived($timers?.find((x) => String(x.mId) === String(missionId)));
  let isRunning = $derived(!!storeTimer?.running);
  let activeTimerData = $derived(storeTimer?.attributes?.activeTimer?.data?.attributes);
  let storeTotalHours = $derived(activeTimerData?.totalHours || 0);
  let storeTimers = $derived(activeTimerData?.timers || []);
  let hasUnsavedTime = $derived(
    !activeTimerData?.saved && (storeTimers.length > 0 || storeTotalHours > 0)
  );

  // The clock is defined by two primitives — the running segment's start and
  // the accumulated base — so a store refresh that doesn't move either leaves
  // the ticking interval alone (no jump, no double animation).
  let runningStartMs = $derived(
    isRunning && storeTimers.length > 0
      ? new Date(storeTimers[storeTimers.length - 1].start).getTime()
      : null
  );
  let baseMs = $derived(storeTotalHours * 3600000);
  let localZman = $state(0);

  $effect(() => {
    const start = runningStartMs;
    const base = baseMs;
    if (start != null) {
      const tick = () => (localZman = Date.now() - start + base);
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
    // Stopped: show the stored total, and keep the dialogs' label in step.
    localZman = base;
    elapsedTime = clock(localZman);
  });

  function pad(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  /** `hh:mm:ss` — no tenths; this sits in a table row, not on a stopwatch. */
  function clock(ms) {
    const s = Math.max(0, Math.floor((ms || 0) / 1000));
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  }

  // ── Timer dialogs (save / clear / edit laps) ────────────────────────────────
  let showSaveDialog = $state(false);
  let showClearDialog = $state(false);
  let showSaveFinal = $state(false);
  let dialogEdit = $state(true);
  let elapsedTime = $state('00:00:00');
  let selectedTasks = $state([]);
  let taskSearchTerm = $state('');

  /** Write a timer update back into the global store (optimistic + result). */
  function updateStore(running, res = null) {
    updateTimers(
      $timers.map((x) =>
        String(x.mId) === String(missionId)
          ? {
              ...x,
              running,
              attributes: {
                ...x.attributes,
                activeTimer: {
                  ...x.attributes?.activeTimer,
                  data: res || x.attributes?.activeTimer?.data,
                  isActive: running
                }
              }
            }
          : x
      )
    );
  }

  async function handleStart() {
    const activeTimer = storeTimer?.attributes?.activeTimer;
    const currentData = activeTimer?.data;
    const currentTimerId = currentData?.attributes?.saved ? 0 : currentData?.id || 0;
    const now = new Date().toISOString();

    const optimisticData = {
      ...currentData,
      id: currentData?.id,
      attributes: {
        ...currentData?.attributes,
        isActive: true,
        timers: [...(currentData?.attributes?.timers || []), { start: now, stop: null }]
      }
    };
    updateStore(true, optimisticData);

    try {
      const res = await startTimer(
        activeTimer,
        String(missionId),
        page.data.uid,
        String(projectId),
        fetch,
        currentTimerId,
        false
      );
      if (res) updateStore(true, res);
    } catch (e) {
      console.error('[MissionControls] start failed', e);
      updateStore(false);
      toast.warning($t('lev.missionInProgress.error'));
    }
  }

  async function handleStop() {
    const timerDataToStop = storeTimer?.attributes?.activeTimer?.data;
    if (!timerDataToStop) return;

    updateStore(false);
    try {
      const res = await stopTimer(
        timerDataToStop,
        fetch,
        false,
        String(projectId),
        page.data.uid
      );
      if (res) {
        updateStore(false, res);
        toast.info($t('lev.missionInProgress.timerStopped'));
        elapsedTime = clock(localZman);
        showSaveDialog = true;
        lockTimerForEdit(missionId);
        dialogEdit = false;
      }
    } catch (e) {
      console.error('[MissionControls] stop failed', e);
      updateStore(true);
      toast.warning($t('lev.missionInProgress.error'));
    }
  }

  function openTimerEditor() {
    // The button reads "save timer" while there is unsaved time and "edit
    // timer" otherwise — so send it where its own label points. It used to open
    // the same menu either way, and the times themselves were another click in
    // behind a button that said "clear the timer".
    if (hasUnsavedTime) {
      showSaveDialog = true;
      dialogEdit = false;
    } else {
      showClearDialog = true;
    }
    lockTimerForEdit(missionId);
  }

  // ── Progress percentage ─────────────────────────────────────────────────────
  let statusOpen = $state(false);
  let statusValues = $state([0]);
  let statusBusy = $state(false);

  function openStatus() {
    statusValues = [Math.max(0, Math.min(100, Number(status) || 0))];
    statusOpen = true;
  }

  async function saveStatus() {
    statusBusy = true;
    try {
      const result = await executeAction('updateMissionStatus', {
        mId: String(missionId),
        projectId: String(projectId),
        status: statusValues[0]
      });
      if (!result.success) throw new Error(result.error?.message ?? 'failed');
      onStatus?.(statusValues[0]);
      statusOpen = false;
      toast.success($t('lev.missionInProgress.saved'));
    } catch (e) {
      console.error('[MissionControls] status failed', e);
      toast.warning($t('lev.missionInProgress.error'));
    } finally {
      statusBusy = false;
    }
  }

  // ── Finish the mission ──────────────────────────────────────────────────────
  let finishOpen = $state(false);
  let why = $state('');
  /** @type {FileList|null} */
  let what = $state(null);
  let finishBusy = $state(false);
  let finishError = $state('');

  /**
   * A mission can only be submitted once the clock is settled: a running timer
   * would keep counting past the submission, and time logged but never saved
   * would simply be lost from the approved hours.
   */
  function openFinish() {
    if (isRunning) {
      toast.warning($t('moach.progress.stopTimerFirst'));
      return;
    }
    if (hasUnsavedTime) {
      toast.warning($t('moach.progress.saveTimerFirst'));
      openTimerEditor();
      return;
    }
    finishError = '';
    finishOpen = true;
  }

  async function submitFinish() {
    finishBusy = true;
    finishError = '';

    let uploadedId = false;
    if (what && what[0]) {
      const fd = new FormData();
      fd.append('files', what[0]);
      try {
        const resp = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!resp.ok) throw new Error('upload failed');
        const data = await resp.json();
        uploadedId = data[0]?.id ?? false;
      } catch (e) {
        console.error('[MissionControls] upload failed', e);
        finishError = $t('moach.progress.uploadFailed');
        finishBusy = false;
        return;
      }
    }

    if (!why.trim() && !uploadedId) {
      finishError = $t('lev.missionInProgress.uploadDescription');
      finishBusy = false;
      return;
    }

    try {
      const result = await executeAction(
        'completeMission',
        {
          missionId: String(missionId),
          why: why ?? '',
          what: uploadedId ? String(uploadedId) : undefined
        },
        { showErrorToast: false }
      );
      if (!result.success) throw new Error(result.error?.message ?? 'failed');
      finishOpen = false;
      why = '';
      what = null;
      // In a one-member rikma completeMission skips the finiapruval entirely and
      // writes the FinnishedMission straight away, so "sent for approval" would
      // be a lie — and the row would show a ⏳ badge for an approval that will
      // never exist. Follow the server's own answer.
      const completedOutright = result.data?.createdType === 'finnishedMission';
      toast.success(
        completedOutright
          ? $t('moach.progress.missionCompleted')
          : $t('moach.progress.sentForApproval')
      );
      onCompleted?.(completedOutright ? 'completed' : 'approvalPending');
    } catch (e) {
      console.error('[MissionControls] complete failed', e);
      finishError = e?.message ?? $t('lev.missionInProgress.error');
    } finally {
      finishBusy = false;
    }
  }
</script>

{#if storeTimer}
  <TimerDialogs
    timer={storeTimer}
    bind:showSaveDialog
    bind:showClearDialog
    bind:showSaveFinal
    bind:dialogEdit
    bind:elapsedTime
    bind:selectedTasks
    bind:taskSearchTerm
    onUpdateTimer={({ timer: updated, running, hoursdon }) => {
      if (updated) {
        updateStore(running, updated);
      } else {
        updateStore(false);
      }
      if (hoursdon !== undefined) {
        updateTimers(
          $timers.map((x) =>
            String(x.mId) === String(missionId)
              ? { ...x, attributes: { ...x.attributes, howmanyhoursalready: hoursdon } }
              : x
          )
        );
      }
      onTimerSaved?.();
    }}
  />
{/if}

<div class="mc" class:mc-compact={compact} dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if isMine}
    {#if storeTimer}
      <span class="mc-clock" class:running={isRunning} title={$t('lev.cards.inpro.timer')}>
        {clock(localZman)}
      </span>

      <button
        type="button"
        class="mc-btn"
        class:mc-stop={isRunning}
        class:mc-go={!isRunning}
        onclick={isRunning ? handleStop : handleStart}
        title={isRunning ? $t('moach.progress.stopTimer') : $t('moach.progress.startTimer')}
      >
        <span aria-hidden="true">{isRunning ? '■' : '▶'}</span>
        <span class="mc-label">
          {isRunning ? $t('moach.progress.stopTimer') : $t('moach.progress.startTimer')}
        </span>
      </button>

      <button
        type="button"
        class="mc-btn"
        class:mc-alert={hasUnsavedTime}
        onclick={openTimerEditor}
        title={$t('lev.cards.inpro.editTimer')}
      >
        <span aria-hidden="true">✎</span>
        <span class="mc-label">
          {hasUnsavedTime ? $t('moach.progress.saveTimer') : $t('lev.cards.inpro.editTimer')}
        </span>
      </button>
    {:else}
      <span class="mc-hint">{$t('moach.progress.timerUnavailable')}</span>
    {/if}

    <button type="button" class="mc-btn" onclick={openStatus} title={$t('moach.progress.status')}>
      <span aria-hidden="true">◐</span>
      <span class="mc-label">{$t('moach.progress.updateStatus')}</span>
    </button>

    {#if pendingApproval}
      <span class="mc-pending" title={$t('moach.progress.awaitingApprovalHint')}>
        ⏳ {$t('moach.progress.awaitingApproval')}
      </span>
    {:else}
      <button type="button" class="mc-btn mc-done" onclick={openFinish} title={$t('lev.cards.inpro.completeTask')}>
        <span aria-hidden="true">✓</span>
        <span class="mc-label">{$t('lev.cards.inpro.completeTask')}</span>
      </button>
    {/if}
  {/if}

  {#if showArchiveActions}
    <ProposeEditButton
      targetKind="missionInProgress"
      targetId={missionId}
      targetName={missionName}
      currentHm={hoursAssigned}
      currentPrice={perhour}
      icon="✎"
      className="mc-btn"
    />
    <ArchiveObjectButton
      targetKind="missionInProgress"
      targetId={missionId}
      targetName={missionName}
      {accruedHours}
      {isMine}
      {ownerName}
      icon="📦"
      className="mc-btn"
    />
  {/if}

  <!-- A mission that already exists can still grow a stipend: the need usually
       appears *after* the work starts, not while the mission is being written.
       Deliberately its own button and not a field on the edit proposal — an
       edit renegotiates the mission's terms with the whole rikma, while a
       stipend is an agreement between the two members about who funds whose
       living costs, and (as long as it dilutes nobody) only they sign it.
       Which one it is stays derived from the terms, in the dialog.

       Whose question it is flips with the viewer: on my own mission it reads
       "I need a stipend to keep at this"; on someone else's, "I'll fund this",
       with them already filled in as the recipient. -->
  {#if showStipendAction && projectId}
    <StipendButton
      intent={isMine ? 'request' : 'offer'}
      projectId={String(projectId)}
      {myId}
      recipientId={isMine ? myId : ownerId != null ? String(ownerId) : ''}
      funderId={isMine ? '' : myId}
      missionId={String(missionId)}
      {missionName}
      marketRate={perhour != null ? Number(perhour) : null}
      missionValue={hoursAssigned != null && perhour != null
        ? Number(hoursAssigned) * Number(perhour)
        : null}
      icon="💗"
      className="mc-btn"
    />
  {/if}
</div>

<!-- progress percentage -->
<DialogOverlay isOpen={statusOpen} onDismiss={() => (statusOpen = false)} style="z-index: 700;">
  <div style="z-index: 700;">
    <DialogContent aria-label="mission-status" class="mc-dialog">
      <div dir={$isRtl ? 'rtl' : 'ltr'} class="mc-dialog-body">
        <h2 class="mc-dialog-title">{$t('lev.missionInProgress.statusLabel')}</h2>
        {#if missionName}<p class="mc-dialog-sub">{missionName}</p>{/if}
        <div dir="ltr" class="mc-slider">
          <RangeSlider bind:values={statusValues} suffix="%" pipstep={20} float pips all="label" hoverable />
        </div>
        <div class="mc-dialog-actions">
          <button type="button" class="mc-ghost" onclick={() => (statusOpen = false)}>
            {$t('lev.missionInProgress.cancel')}
          </button>
          <button type="button" class="mc-primary" disabled={statusBusy} onclick={saveStatus}>
            {statusBusy ? $t('lev.missionInProgress.pleaseWait') : $t('lev.missionInProgress.save')}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- submit for approval -->
<DialogOverlay isOpen={finishOpen} onDismiss={() => (finishOpen = false)} style="z-index: 700;">
  <div style="z-index: 700;">
    <DialogContent aria-label="mission-finish" class="mc-dialog">
      <div dir={$isRtl ? 'rtl' : 'ltr'} class="mc-dialog-body">
        <h2 class="mc-dialog-title">{$t('lev.missionInProgress.uploadTitle')}</h2>
        {#if missionName}<p class="mc-dialog-sub">{missionName}</p>{/if}
        <p class="mc-dialog-note">{$t('lev.missionInProgress.uploadDescription')}</p>

        <label class="mc-field">
          <span>{$t('lev.missionInProgress.fileLabel')}</span>
          <input type="file" bind:files={what} />
        </label>

        <label class="mc-field">
          <span>{$t('lev.missionInProgress.descriptionPlaceholder')}</span>
          <textarea
            rows="4"
            bind:value={why}
            placeholder={$t('lev.missionInProgress.descriptionPlaceholder')}
          ></textarea>
        </label>

        {#if finishError}
          <p class="mc-error">{finishError}</p>
        {/if}

        <div class="mc-dialog-actions">
          <button type="button" class="mc-ghost" onclick={() => (finishOpen = false)}>
            {$t('lev.missionInProgress.cancel')}
          </button>
          <button type="button" class="mc-primary" disabled={finishBusy} onclick={submitFinish}>
            {finishBusy
              ? $t('lev.missionInProgress.pleaseWait')
              : $t('lev.missionInProgress.submitButton')}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
  .mc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .mc-clock {
    font-family: ui-monospace, 'DS-Digital', monospace;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    padding: 3px 9px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: rgba(2, 6, 23, 0.55);
    color: #cbd5e1;
  }
  .mc-clock.running {
    border-color: rgba(46, 255, 168, 0.55);
    color: #2effa8;
    box-shadow: 0 0 10px rgba(46, 255, 168, 0.25);
  }

  /* `mc-btn` is also handed to child components (`ArchiveObjectButton`,
     `ProposeEditButton`, `StipendButton`) via their `className` prop. Svelte
     scopes a plain `.mc-btn` rule to this component's own markup, so those
     three rendered as unstyled browser buttons in the middle of the strip.
     Scoping on the wrapper and reaching in with `:global` covers both: the
     local buttons are descendants of `.mc` too. */
  .mc :global(.mc-btn) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 9999px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    background: rgba(15, 23, 42, 0.72);
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.4;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .mc :global(.mc-btn:hover) {
    border-color: var(--gold, #eee8aa);
    color: var(--gold, #eee8aa);
    background: rgba(238, 232, 170, 0.12);
  }

  .mc-go:hover {
    border-color: #2effa8;
    color: #2effa8;
    background: rgba(46, 255, 168, 0.12);
  }
  .mc-stop {
    border-color: rgba(255, 0, 146, 0.5);
    color: #ff9ad5;
  }
  .mc-stop:hover {
    border-color: var(--barbi-pink, #ff0092);
    color: #ff9ad5;
    background: rgba(255, 0, 146, 0.16);
  }
  .mc-alert {
    border-color: rgba(238, 232, 170, 0.6);
    color: var(--gold, #eee8aa);
  }
  .mc-done:hover {
    border-color: #2effa8;
    color: #2effa8;
    background: rgba(46, 255, 168, 0.12);
  }

  .mc-pending {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(238, 232, 170, 0.14);
    color: #eee8aa;
  }

  .mc-hint {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  /* In a dense table row only the icons stay; the words return from sm up. */
  .mc-compact :global(.mc-label) {
    display: none;
  }
  @media (min-width: 640px) {
    .mc-compact :global(.mc-label) {
      display: inline;
    }
  }

  :global([data-svelte-dialog-content].mc-dialog) {
    width: min(92vw, 34rem);
    background: linear-gradient(147deg, #0b1220 0%, #10243a 74%);
    border: 1px solid rgba(238, 232, 170, 0.3);
    border-radius: 16px;
    padding: 1.5rem;
    color: #e2e8f0;
    z-index: 701;
  }

  .mc-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    text-align: start;
  }
  .mc-dialog-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--gold, #eee8aa);
  }
  .mc-dialog-sub {
    margin: 0;
    font-size: 0.85rem;
    color: #cbd5e1;
  }
  .mc-dialog-note {
    margin: 0;
    font-size: 0.78rem;
    color: #94a3b8;
  }
  .mc-slider {
    padding: 0.5rem 0.25rem 0;
  }

  .mc-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: #cbd5e1;
  }
  .mc-field textarea,
  .mc-field input[type='file'] {
    width: 100%;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(2, 6, 23, 0.5);
    color: #e2e8f0;
    padding: 0.5rem 0.65rem;
    font-size: 0.85rem;
  }
  .mc-field textarea:focus,
  .mc-field input[type='file']:focus {
    outline: none;
    border-color: var(--gold, #eee8aa);
  }

  .mc-error {
    margin: 0;
    font-size: 0.8rem;
    color: #fda4af;
    background: rgba(244, 63, 94, 0.12);
    border-radius: 8px;
    padding: 0.5rem 0.65rem;
  }

  .mc-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 0.25rem;
  }
  .mc-ghost,
  .mc-primary {
    border-radius: 9999px;
    padding: 0.45rem 1.1rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.12s, background 0.12s;
  }
  .mc-ghost {
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: transparent;
    color: #cbd5e1;
  }
  .mc-ghost:hover {
    background: rgba(148, 163, 184, 0.14);
  }
  .mc-primary {
    border: 1px solid var(--gold, #eee8aa);
    background: var(--gold, #eee8aa);
    color: #0f172a;
  }
  .mc-primary:hover {
    opacity: 0.88;
  }
  .mc-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
