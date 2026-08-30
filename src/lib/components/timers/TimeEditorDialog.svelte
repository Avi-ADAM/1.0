<script lang="ts">
  /**
   * The global home of the time editor.
   *
   * Mounted once in the root layout, so `openTimeEditor({ missionId })` from
   * anywhere — a lev card, the moach, the chat bot, a notification deep link —
   * opens the same editor on the same data. Callers do not have to own a timer
   * widget, hold the timer id, or know how the store is shaped.
   */
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import { t, isRtl } from '$lib/translations';
  import { page } from '$app/state';
  import { timers, fetchTimers, unlockTimerForEdit } from '$lib/stores/timers';
  import { timeEditor, openTimeEditor, closeTimeEditor } from '$lib/stores/timeEditor.svelte';
  import TimeEditor from './TimeEditor.svelte';

  let fetching = $state(false);
  let fetchedFor = $state('');

  const target = $derived(timeEditor.target);

  /**
   * `?editTime=<missionId>` opens the editor on any route.
   *
   * That is the address an email, a push notification or the Telegram bot can
   * link to — previously the best any of them could do was drop the member on
   * /timers and leave them to find the editor themselves.
   */
  let deepLinked = $state('');
  $effect(() => {
    const wanted = page.url?.searchParams?.get('editTime');
    if (!wanted || wanted === deepLinked) return;
    deepLinked = wanted;
    openTimeEditor({ missionId: wanted });
  });

  /** The live entry from the timers store, when it has one. */
  const entry = $derived(
    target
      ? $timers.find((x: any) => String(x.mId) === String(target.missionId)) ?? null
      : null
  );

  const activeTimer = $derived(entry?.attributes?.activeTimer?.data ?? null);

  const resolved = $derived.by(() => {
    if (!target) return null;
    if (activeTimer) {
      return {
        missionId: String(target.missionId),
        missionName: entry?.missionName ?? entry?.attributes?.name ?? target.missionName ?? '',
        timerId: String(activeTimer.id),
        projectId: String(entry?.projectId ?? target.projectId ?? ''),
        intervals: activeTimer.attributes?.timers ?? []
      };
    }
    // Nothing in the store yet — fall back to whatever the caller handed us
    // (the chat card already has the intervals it was rendered with).
    if (target.timerId) {
      return {
        missionId: String(target.missionId),
        missionName: target.missionName ?? '',
        timerId: String(target.timerId),
        projectId: String(target.projectId ?? ''),
        intervals: target.intervals ?? []
      };
    }
    return null;
  });

  // The store is only filled by the pages that ask for it. Opening the editor
  // from a page that never called fetchTimers has to warm it up once.
  $effect(() => {
    if (!timeEditor.open || !target || resolved) return;
    const uid = page.data?.uid;
    const key = String(target.missionId);
    if (!uid || fetching || fetchedFor === key) return;
    fetching = true;
    fetchedFor = key;
    fetchTimers(uid, fetch)
      .catch((e: unknown) => console.error('[TimeEditorDialog] fetchTimers failed', e))
      .finally(() => (fetching = false));
  });

  function dismiss() {
    if (target) unlockTimerForEdit(target.missionId, { refresh: true });
    fetchedFor = '';
    closeTimeEditor();
  }
</script>

<DialogOverlay style="z-index: 900;" isOpen={timeEditor.open} onDismiss={dismiss}>
  <div style="z-index: 900;" transition:fly|local={{ y: 40, duration: 250 }}>
    <DialogContent aria-label={$t('timers.editorTitle')} class="time-editor-dialog">
      <button class="ted-close" onclick={dismiss} aria-label={$t('timers.editorCancel')}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div class="ted-body" dir={$isRtl ? 'rtl' : 'ltr'}>
        {#if resolved}
          <TimeEditor
            missionId={resolved.missionId}
            missionName={resolved.missionName}
            timerId={resolved.timerId}
            projectId={resolved.projectId}
            intervals={resolved.intervals}
          />
        {:else if fetching}
          <p class="ted-msg">{$t('timers.editorLoading')}</p>
        {:else}
          <p class="ted-msg">{$t('timers.editorNotFound')}</p>
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
  :global([data-svelte-dialog-content].time-editor-dialog) {
    background: linear-gradient(147deg, #000000 0%, #04619f 74%);
    padding: 1.75rem 1.5rem 1.25rem;
    border-radius: 12px;
    color: #fff;
    width: 92vw;
    max-width: 560px;
    min-width: 300px;
    position: relative;
    margin: 2rem auto;
    z-index: 901;
  }

  .ted-close {
    position: absolute;
    top: 0.5rem;
    inset-inline-end: 0.5rem;
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 0;
  }

  .ted-msg {
    margin: 0;
    text-align: center;
    opacity: 0.85;
  }
</style>
