<script lang="ts">
  /**
   * The edit card the timer agent promises in chat.
   *
   * It used to be a second, independent implementation of the interval editor —
   * with its own `{ he, en }` dictionary, no delete, no add and no overlap
   * check — and the popup chat never rendered it at all. Now it is a frame
   * around the one editor: what a member sees here is what they see in the
   * timer dialog and in the global editor, and a change made here shows up in
   * both.
   */
  import { t, isRtl } from '$lib/translations';
  import { openTimeEditor } from '$lib/stores/timeEditor.svelte';
  import TimeEditor from '$lib/components/timers/TimeEditor.svelte';
  import type { Interval } from '$lib/timers/intervals';

  let {
    missionId,
    missionName,
    timerId,
    projectId,
    intervals = []
  }: {
    missionId: string;
    missionName: string;
    timerId: string;
    projectId: string;
    intervals?: Interval[];
  } = $props();
</script>

<div class="tec" dir={$isRtl ? 'rtl' : 'ltr'}>
  <TimeEditor
    compact
    {missionId}
    {missionName}
    {timerId}
    {projectId}
    {intervals}
  />

  <!-- The bubble is narrow; anything fiddly is better done in the full-size
       editor, which is one call away from anywhere in the app. -->
  <button
    type="button"
    class="tec-expand"
    onclick={() => openTimeEditor({ missionId, missionName, timerId, projectId, intervals })}
  >
    {$t('timers.editorOpenFull')}
  </button>
</div>

<style>
  .tec {
    background: linear-gradient(135deg, #0a2a1a 0%, #0f3820 60%, #1a3010 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 12px;
    padding: 14px;
    color: #e8e8e8;
    margin-top: 6px;
    min-width: 260px;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .tec-expand {
    align-self: flex-start;
    background: transparent;
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 6px;
    color: #d4af37;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.3rem 0.7rem;
  }

  .tec-expand:hover {
    background: rgba(212, 175, 55, 0.12);
  }
</style>
