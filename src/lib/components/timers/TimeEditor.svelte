<script lang="ts">
  /**
   * The one time editor.
   *
   * Every surface that lets a member correct logged hours renders this: the
   * timer dialog, the global editor opened from anywhere via `openTimeEditor`,
   * and the card the chat bot promises. Before this there were two separate
   * implementations that disagreed about what a valid interval is, and the
   * chat's one was never actually rendered.
   *
   * It owns the list it shows, writes through `updateTimer` and pushes the
   * result into the `timers` store so every open view of the same mission
   * follows along.
   */
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { t, isRtl, locale } from '$lib/translations';
  import { page } from '$app/state';
  import { updateTimer } from '$lib/func/timers.js';
  import {
    timers as timersStore,
    updateTimers,
    lockTimerForEdit,
    unlockTimerForEdit
  } from '$lib/stores/timers';
  import {
    formatDuration,
    intervalMs,
    isRunning,
    sortIntervals,
    suggestNewInterval,
    toPersistable,
    totalHours,
    validateInterval,
    type Interval
  } from '$lib/timers/intervals';

  let {
    missionId,
    missionName = '',
    timerId,
    projectId = '',
    intervals: seed = [],
    /** Called after every successful write with the new list. */
    onChanged = undefined,
    /** Chat/card context: tighter spacing, no page-level chrome. */
    compact = false
  }: {
    missionId: string | number;
    missionName?: string;
    timerId: string | number;
    projectId?: string | number;
    intervals?: Interval[];
    onChanged?: (intervals: Interval[]) => void;
    compact?: boolean;
  } = $props();

  // ── The list being edited ────────────────────────────────────────────────
  // Seeded from the caller and re-seeded only when the editor is pointed at a
  // different timer. Re-seeding on every prop change would yank a row out from
  // under someone mid-edit every time the socket refreshed the store.
  let rows = $state<Interval[]>([]);
  let seededFor = $state<string | null>(null);

  $effect(() => {
    const id = String(timerId ?? '');
    const incoming = seed ?? [];
    untrack(() => {
      if (id !== seededFor) {
        rows = sortIntervals(incoming);
        seededFor = id;
        editingIdx = -1;
      }
    });
  });

  let editingIdx = $state(-1);
  let editStart = $state('');
  let editStop = $state('');
  let errorKey = $state('');
  let saving = $state(false);
  let savedIdx = $state(-1);
  let confirmDeleteIdx = $state(-1);

  const total = $derived(totalHours(rows));
  const dateLocale = $derived($locale === 'he' ? 'he-IL' : $locale || 'en');

  function toInput(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function display(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  function startEdit(i: number) {
    if (isRunning(rows[i])) return;
    errorKey = '';
    confirmDeleteIdx = -1;
    editingIdx = i;
    editStart = toInput(rows[i].start);
    editStop = rows[i].stop ? toInput(rows[i].stop as string) : '';
    lockTimerForEdit(missionId);
  }

  function cancelEdit() {
    // A row added but never saved leaves nothing behind.
    if (editingIdx > -1 && rows[editingIdx]?.isNew) {
      rows = rows.filter((_, i) => i !== editingIdx);
    }
    editingIdx = -1;
    errorKey = '';
    unlockTimerForEdit(missionId, { refresh: true });
  }

  /** Writes the whole list; returns true when the server took it. */
  async function persist(next: Interval[]): Promise<boolean> {
    saving = true;
    try {
      const result = await updateTimer(
        { id: timerId, attributes: { timers: toPersistable(next) } },
        'intervals',
        { intervals: next },
        fetch,
        String(projectId ?? ''),
        page.data?.uid ?? ''
      );
      if (!result) {
        errorKey = 'editorError';
        return false;
      }

      rows = sortIntervals(next);
      // Keep every other view of this mission in step.
      updateTimers(
        $timersStore.map((entry: any) =>
          String(entry.mId) === String(missionId) && entry?.attributes?.activeTimer?.data
            ? {
                ...entry,
                attributes: {
                  ...entry.attributes,
                  activeTimer: {
                    ...entry.attributes.activeTimer,
                    data: {
                      ...entry.attributes.activeTimer.data,
                      attributes: {
                        ...entry.attributes.activeTimer.data.attributes,
                        timers: toPersistable(rows),
                        totalHours: totalHours(rows)
                      }
                    }
                  }
                }
              }
            : entry
        )
      );
      onChanged?.(rows);
      return true;
    } catch (e) {
      console.error('[TimeEditor] update failed', e);
      errorKey = 'editorError';
      return false;
    } finally {
      saving = false;
    }
  }

  async function saveEdit(i: number) {
    errorKey = '';
    const start = editStart ? new Date(editStart).toISOString() : '';
    const stop = editStop ? new Date(editStop).toISOString() : null;
    if (!start) {
      errorKey = 'editorEndBeforeStart';
      return;
    }

    const next = rows.map((row, idx) => (idx === i ? { start, stop } : row));
    const problem = validateInterval({ start, stop }, next, i);
    if (problem) {
      errorKey = problem;
      return;
    }

    if (await persist(next)) {
      editingIdx = -1;
      savedIdx = rows.findIndex((r) => r.start === start);
      setTimeout(() => (savedIdx = -1), 2000);
      unlockTimerForEdit(missionId, { refresh: true });
      toast.success($t('timers.editorSaved'));
    }
  }

  async function deleteRow(i: number) {
    errorKey = '';
    confirmDeleteIdx = -1;
    lockTimerForEdit(missionId);
    const next = rows.filter((_, idx) => idx !== i);
    if (await persist(next)) {
      toast.success($t('timers.editorSaved'));
    }
    unlockTimerForEdit(missionId, { refresh: true });
  }

  /** Adds a row prefilled with a free hour and drops straight into editing it. */
  function addRow() {
    errorKey = '';
    const slot = suggestNewInterval(rows);
    rows = [...rows, { ...slot, isNew: true }];
    editingIdx = rows.length - 1;
    editStart = toInput(slot.start);
    editStop = toInput(slot.stop);
    lockTimerForEdit(missionId);
  }
</script>

<div class="te" class:te-compact={compact} dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="te-head">
    <div class="te-titles">
      <span class="te-title">{$t('timers.editorTitle')}</span>
      {#if missionName}
        <span class="te-mission">{missionName}</span>
      {/if}
    </div>
    <span class="te-total" title={$t('timers.editorTotal')}>
      {$t('timers.editorTotal')}: <strong>{formatDuration(total * 3_600_000)}</strong>
    </span>
  </header>

  <p class="te-hint">{$t('timers.editorHint')}</p>

  {#if rows.length === 0}
    <p class="te-empty">{$t('timers.editorEmpty')}</p>
  {:else}
    <ul class="te-list">
      {#each rows as row, i (row.start + '|' + (row.stop ?? 'run') + '|' + i)}
        {@const running = isRunning(row)}
        <li class="te-row" class:editing={editingIdx === i} class:saved={savedIdx === i}>
          {#if editingIdx === i}
            <div class="te-form">
              <label class="te-field">
                <span>{$t('timers.editorStart')}</span>
                <input type="datetime-local" bind:value={editStart} />
              </label>
              <label class="te-field">
                <span>{$t('timers.editorEnd')}</span>
                <input type="datetime-local" bind:value={editStop} min={editStart} />
              </label>
              {#if errorKey}
                <p class="te-error" role="alert">{$t(`timers.${errorKey}`)}</p>
              {/if}
              <div class="te-form-actions">
                <button type="button" class="te-btn te-primary" onclick={() => saveEdit(i)} disabled={saving}>
                  {saving ? '…' : $t('timers.editorSave')}
                </button>
                <button type="button" class="te-btn te-ghost" onclick={cancelEdit} disabled={saving}>
                  {$t('timers.editorCancel')}
                </button>
              </div>
            </div>
          {:else}
            <div class="te-when">
              <span class="te-time">{display(row.start)}</span>
              <span class="te-arrow" aria-hidden="true">→</span>
              <span class="te-time">
                {row.stop ? display(row.stop as string) : $t('timers.editorRunning')}
              </span>
              <span class="te-dur" class:running>{formatDuration(intervalMs(row))}</span>
            </div>

            <div class="te-row-actions">
              {#if running}
                <span class="te-running-note">{$t('timers.editorRunningNote')}</span>
              {:else if confirmDeleteIdx === i}
                <span class="te-confirm">{$t('timers.editorDeleteConfirm')}</span>
                <button type="button" class="te-btn te-danger" onclick={() => deleteRow(i)} disabled={saving}>
                  {$t('timers.editorDelete')}
                </button>
                <button type="button" class="te-btn te-ghost" onclick={() => (confirmDeleteIdx = -1)}>
                  {$t('timers.editorCancel')}
                </button>
              {:else}
                <button
                  type="button"
                  class="te-icon"
                  onclick={() => startEdit(i)}
                  aria-label="{$t('timers.editorEdit')} — {display(row.start)}"
                  title={$t('timers.editorEdit')}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="te-icon te-icon-danger"
                  onclick={() => (confirmDeleteIdx = i)}
                  aria-label="{$t('timers.editorDelete')} — {display(row.start)}"
                  title={$t('timers.editorDelete')}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"/>
                  </svg>
                </button>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if errorKey && editingIdx === -1}
    <p class="te-error" role="alert">{$t(`timers.${errorKey}`)}</p>
  {/if}

  <div class="te-foot">
    <button type="button" class="te-btn te-add" onclick={addRow} disabled={saving || editingIdx > -1}>
      <span aria-hidden="true">＋</span> {$t('timers.editorAdd')}
    </button>
    <span class="te-note">{$t('timers.editorUnsavedHint')}</span>
  </div>
</div>

<style>
  .te {
    --te-line: rgba(255, 255, 255, 0.14);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    color: inherit;
    font-size: 0.9rem;
  }

  .te-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .te-titles {
    display: flex;
    flex-direction: column;
  }

  .te-title {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .te-mission {
    font-size: 0.8rem;
    opacity: 0.75;
  }

  .te-total {
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0.9;
  }

  .te-hint,
  .te-note {
    margin: 0;
    font-size: 0.75rem;
    opacity: 0.7;
    line-height: 1.4;
  }

  .te-empty {
    margin: 0;
    padding: 0.75rem;
    border: 1px dashed var(--te-line);
    border-radius: 8px;
    font-size: 0.85rem;
    opacity: 0.85;
    text-align: center;
  }

  .te-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 46vh;
    overflow-y: auto;
  }

  .te-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--te-line);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
  }

  .te-row.editing {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(212, 175, 55, 0.55);
  }

  .te-row.saved {
    border-color: #4ade80;
  }

  .te-when {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .te-time {
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
  }

  .te-arrow {
    opacity: 0.55;
  }

  .te-dur {
    font-size: 0.75rem;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: rgba(62, 207, 178, 0.18);
    white-space: nowrap;
  }

  .te-dur.running {
    background: rgba(255, 51, 102, 0.22);
  }

  .te-row-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .te-running-note {
    font-size: 0.7rem;
    opacity: 0.75;
    max-width: 22ch;
  }

  .te-confirm {
    font-size: 0.75rem;
  }

  .te-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
  }

  .te-field {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.72rem;
    opacity: 0.85;
  }

  .te-field input {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid var(--te-line);
    border-radius: 6px;
    color: inherit;
    padding: 0.3rem 0.45rem;
    font-size: 0.85rem;
    /* The native picker's own glyphs stay legible on the dark surfaces the
       editor sits on. */
    color-scheme: dark;
  }

  .te-form-actions {
    display: flex;
    gap: 0.4rem;
  }

  .te-btn {
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 0.35rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .te-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .te-primary {
    background: linear-gradient(to right, #4ade80, #3b82f6);
    color: #06121f;
  }

  .te-ghost {
    background: rgba(255, 255, 255, 0.12);
    color: inherit;
    border-color: var(--te-line);
  }

  .te-danger {
    background: linear-gradient(to right, #f43f5e, #ef4444);
    color: #fff;
  }

  .te-add {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--te-line);
    color: inherit;
  }

  .te-icon {
    background: transparent;
    border: 1px solid var(--te-line);
    border-radius: 6px;
    color: inherit;
    padding: 0.25rem 0.35rem;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  .te-icon:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .te-icon-danger:hover {
    background: rgba(244, 63, 94, 0.22);
  }

  .te-error {
    margin: 0;
    font-size: 0.75rem;
    color: #ff8fa3;
  }

  .te-foot {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: space-between;
    border-top: 1px solid var(--te-line);
    padding-top: 0.5rem;
  }

  .te-compact {
    font-size: 0.82rem;
  }

  .te-compact .te-list {
    max-height: 34vh;
  }
</style>
