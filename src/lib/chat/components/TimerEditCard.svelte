<script lang="ts">
  import { isRtl } from '$lib/translations';
  import { updateTimer, calculateTotalHours } from '$lib/func/timers.js';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang';

  interface Interval {
    start: string;
    stop?: string | null;
  }

  let {
    missionId,
    missionName,
    timerId,
    projectId,
    intervals: initIntervals
  }: {
    missionId: string;
    missionName: string;
    timerId: string;
    projectId: string;
    intervals: Interval[];
  } = $props();

  let intervals = $state<Interval[]>([...initIntervals]);
  let editingIdx = $state(-1);
  let editStart = $state('');
  let editEnd = $state('');
  let saving = $state(false);
  let errorMsg = $state('');
  let successIdx = $state(-1);

  const labels = {
    he: {
      title: 'עריכת קטעי זמן',
      start: 'התחלה',
      end: 'סיום',
      duration: 'משך',
      edit: 'ערוך',
      save: 'שמור',
      cancel: 'ביטול',
      running: 'פועל',
      endBeforeStart: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה',
      updated: 'עודכן',
      error: 'שגיאה בעדכון'
    },
    en: {
      title: 'Edit Timer Intervals',
      start: 'Start',
      end: 'End',
      duration: 'Duration',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      running: 'Running',
      endBeforeStart: 'End time must be after start time',
      updated: 'Updated',
      error: 'Update failed'
    }
  };

  const L = $derived(labels[$lang as 'he' | 'en'] ?? labels.he);

  function toInputFormat(iso: string) {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function formatDisplay(iso: string) {
    return new Date(iso).toLocaleString($lang === 'he' ? 'he-IL' : 'en-US', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  function formatDuration(start: string, stop: string | null | undefined) {
    const ms = (stop ? new Date(stop).getTime() : Date.now()) - new Date(start).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function startEdit(i: number) {
    errorMsg = '';
    editingIdx = i;
    editStart = toInputFormat(intervals[i].start);
    editEnd = intervals[i].stop ? toInputFormat(intervals[i].stop!) : '';
  }

  function cancelEdit() {
    editingIdx = -1;
    errorMsg = '';
  }

  async function saveEdit(i: number) {
    errorMsg = '';
    const newStartISO = new Date(editStart).toISOString();
    const newEndISO = editEnd ? new Date(editEnd).toISOString() : null;

    if (newEndISO && new Date(newEndISO) <= new Date(newStartISO)) {
      errorMsg = L.endBeforeStart;
      return;
    }

    const oldLap = { start: intervals[i].start, stop: intervals[i].stop ?? null };
    const newLap = { start: newStartISO, stop: newEndISO };

    const timerObj = {
      id: timerId,
      attributes: { timers: intervals, totalHours: calculateTotalHours(intervals) }
    };

    saving = true;
    try {
      const result = await updateTimer(
        timerObj, 'timers',
        { oldLap, newLap, index: i },
        undefined,
        projectId,
        page.data?.uid
      );

      if (result) {
        intervals = intervals.map((iv, idx) =>
          idx === i ? { start: newStartISO, stop: newEndISO } : iv
        );
        editingIdx = -1;
        successIdx = i;
        setTimeout(() => { successIdx = -1; }, 2000);
      } else {
        errorMsg = L.error;
      }
    } catch {
      errorMsg = L.error;
    } finally {
      saving = false;
    }
  }

  // Only completed intervals can be edited
  const editableIntervals = $derived(
    intervals.map((iv, i) => ({ iv, i, editable: !!(iv.start && iv.stop) }))
  );
</script>

<div class="tec-card" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="tec-header">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
    <span class="tec-mission">{missionName}</span>
    <span class="tec-title">{L.title}</span>
  </div>

  <div class="tec-list">
    {#each editableIntervals as { iv, i, editable }}
      <div class="tec-row {successIdx === i ? 'success' : ''}" class:editing={editingIdx === i}>
        {#if editingIdx === i}
          <div class="tec-edit-form">
            <label class="tec-label">
              {L.start}
              <input type="datetime-local" bind:value={editStart} class="tec-input" />
            </label>
            {#if iv.stop}
              <label class="tec-label">
                {L.end}
                <input type="datetime-local" bind:value={editEnd} min={editStart} class="tec-input" />
              </label>
            {/if}
            {#if errorMsg}
              <p class="tec-error">{errorMsg}</p>
            {/if}
            <div class="tec-actions">
              <button class="tec-btn save" onclick={() => saveEdit(i)} disabled={saving}>
                {saving ? '...' : L.save}
              </button>
              <button class="tec-btn cancel" onclick={cancelEdit} disabled={saving}>
                {L.cancel}
              </button>
            </div>
          </div>
        {:else}
          <div class="tec-info">
            <span class="tec-time">{formatDisplay(iv.start)}</span>
            <span class="tec-arrow">→</span>
            <span class="tec-time">{iv.stop ? formatDisplay(iv.stop) : L.running}</span>
            <span class="tec-dur">{formatDuration(iv.start, iv.stop)}</span>
          </div>
          {#if editable}
            <button class="tec-btn edit" onclick={() => startEdit(i)} title={L.edit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .tec-card {
    background: linear-gradient(135deg, #0a2a1a 0%, #0f3820 60%, #1a3010 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 12px;
    padding: 14px;
    font-size: 13px;
    color: #e8e8e8;
    margin-top: 6px;
    min-width: 260px;
  }

  .tec-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    color: #d4af37;
  }

  .tec-mission {
    font-weight: 700;
    flex: 1;
    font-size: 13.5px;
  }

  .tec-title {
    font-size: 11px;
    opacity: 0.75;
  }

  .tec-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tec-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 8px 10px;
    transition: background 0.2s;
  }

  .tec-row.editing {
    background: rgba(212, 175, 55, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  .tec-row.success {
    background: rgba(74, 222, 128, 0.15);
  }

  .tec-info {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tec-time {
    font-family: monospace;
    font-size: 12px;
    color: #c8c8c8;
  }

  .tec-arrow {
    opacity: 0.5;
    font-size: 11px;
  }

  .tec-dur {
    font-size: 11px;
    color: #3ecfb2;
    background: rgba(62, 207, 178, 0.12);
    padding: 1px 6px;
    border-radius: 4px;
  }

  .tec-edit-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .tec-label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 11px;
    color: #aaa;
  }

  .tec-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 6px;
    color: #fff;
    padding: 5px 8px;
    font-size: 12px;
    width: 100%;
  }

  .tec-input:focus {
    outline: none;
    border-color: rgba(212, 175, 55, 0.6);
  }

  .tec-actions {
    display: flex;
    gap: 6px;
  }

  .tec-btn {
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    transition: opacity 0.2s, transform 0.1s;
  }

  .tec-btn:hover:not(:disabled) {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  .tec-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tec-btn.save {
    background: linear-gradient(to right, #3ecfb2, #2563eb);
    color: #fff;
  }

  .tec-btn.cancel {
    background: rgba(255, 255, 255, 0.12);
    color: #ccc;
  }

  .tec-btn.edit {
    background: transparent;
    color: #d4af37;
    padding: 4px 6px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .tec-btn.edit:hover {
    background: rgba(212, 175, 55, 0.1);
  }

  .tec-error {
    color: #ff6b6b;
    font-size: 11px;
    margin: 0;
  }
</style>
