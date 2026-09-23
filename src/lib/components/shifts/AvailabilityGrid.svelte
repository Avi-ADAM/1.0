<script lang="ts">
  /**
   * "When can I come?" — a member's own declarations for one cycle
   * (docs/PLAN_SHIFTS.md §3.3, §9.2).
   *
   * Each tap moves a shift one step round want → can → ifNeeded → cannot, and
   * is saved at once (optimistically; reverted with a message if the save
   * fails). The star marks a top choice — the member's own say in which of
   * their shifts they spend their share of "number one" places on (§6.3).
   *
   * What a member says here is their consent to be rostered there (§1.1), so
   * the colours and words must never be ambiguous: each state has its own
   * label as well as its colour.
   */
  import { t, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';
  import { nextStance, stanceKey } from '$lib/shifts/explain';
  import { timeRange } from '$lib/shifts/format';
  import type { Stance } from '$lib/shifts/types';
  import ShiftGrid from './ShiftGrid.svelte';

  interface Shift {
    id: string;
    start: string;
    end: string;
    need: number;
    state?: string | null;
  }
  interface Mine {
    shiftId: string;
    stance: Stance;
    prefRank?: number | null;
    /** Said by a standing rule, not tapped (src/lib/shifts/rules.ts). A tap overrides it. */
    fromRule?: boolean;
  }

  interface Props {
    shifts: Shift[];
    /** This member's own declarations. */
    declarations: Mine[];
    /** This member's rank per shift, once a draft exists. */
    ranks?: Record<string, number>;
    timeZone: string;
    cycleStart: string;
    cycleEnd: string;
    disabled?: boolean;
  }

  let { shifts, declarations, ranks = {}, timeZone, cycleStart, cycleEnd, disabled = false }: Props = $props();

  /** Taps not yet reflected in `declarations` (the page reloads its data only on navigation). */
  let local = $state<Record<string, { stance: Stance; prefRank: number | null; fromRule?: boolean }>>({});
  let saving = $state<Record<string, boolean>>({});

  let stances = $derived.by(() => {
    const out: Record<string, { stance: Stance; prefRank: number | null; fromRule?: boolean }> = {};
    for (const d of declarations) out[d.shiftId] = { stance: d.stance, prefRank: d.prefRank ?? null, fromRule: d.fromRule === true };
    return { ...out, ...local };
  });

  let open = $derived(shifts.filter((s) => s.state !== 'cancelled'));

  async function save(shiftId: string, next: { stance: Stance; prefRank: number | null }) {
    const before = stances[shiftId];
    local[shiftId] = next;
    saving[shiftId] = true;
    try {
      const res = await executeAction('declareShiftAvailability', { shiftId, stance: next.stance, prefRank: next.prefRank });
      if (!res.success) throw new Error(res.error?.message ?? 'save failed');
    } catch {
      if (before) local[shiftId] = before;
      else delete local[shiftId];
      toast.error($t('shifts.grid.saveError'));
    } finally {
      saving[shiftId] = false;
    }
  }

  function tap(shiftId: string) {
    const cur = stances[shiftId];
    const stance = nextStance(cur?.stance);
    // A top choice only means something for a shift you would come to.
    const keepsStar = stance === 'want' || stance === 'can';
    save(shiftId, { stance, prefRank: keepsStar ? (cur?.prefRank ?? null) : null });
  }

  function toggleStar(shiftId: string) {
    const cur = stances[shiftId];
    if (!cur) return;
    save(shiftId, { stance: cur.stance, prefRank: cur.prefRank ? null : 1 });
  }
</script>

<p class="mb-3 text-sm text-surfaceMuted">{$t('shifts.grid.tapHint')}</p>

<ShiftGrid shifts={open} {timeZone} {cycleStart} {cycleEnd} label={$t('shifts.tabs.mine')}>
  {#snippet cell(s)}
    {@const mine = stances[s.id]}
    {@const range = timeRange(s.start, s.end, timeZone, $locale || 'he')}
    {@const rank = ranks[s.id]}
    <div class="av-wrap" data-stance={mine?.stance ?? 'none'}>
      <button
        type="button"
        class="av-cell"
        onclick={() => tap(s.id)}
        disabled={disabled || saving[s.id]}
        aria-label="{range}: {mine ? $t(stanceKey(mine.stance)) : $t('shifts.stance.none')}"
      >
        <span class="av-time">{range}</span>
        <span class="av-stance">{mine ? $t(stanceKey(mine.stance)) : $t('shifts.stance.none')}</span>
        {#if mine?.fromRule}
          <span class="av-meta av-rule">{$t('shifts.rules.byRule')}</span>
        {/if}
        {#if s.need > 1}
          <span class="av-meta">{$t('shifts.grid.need', { count: s.need })}</span>
        {/if}
        {#if rank === 1}
          <span class="av-meta av-coming">{$t('shifts.grid.youComing')}</span>
        {:else if rank}
          <span class="av-meta">{$t('shifts.grid.youBackup', { rank })}</span>
        {/if}
      </button>
      {#if mine && (mine.stance === 'want' || mine.stance === 'can')}
        <button
          type="button"
          class="av-star"
          aria-pressed={!!mine.prefRank}
          aria-label={$t('shifts.grid.topChoice')}
          title={$t('shifts.grid.topChoice')}
          disabled={disabled || saving[s.id]}
          onclick={() => toggleStar(s.id)}>{mine.prefRank ? '★' : '☆'}</button
        >
      {/if}
    </div>
  {/snippet}
</ShiftGrid>

<style>
  .av-wrap {
    position: relative;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-line);
  }
  .av-wrap[data-stance='want'] {
    background: rgb(16 185 129 / 0.22);
    border-color: rgb(16 185 129 / 0.8);
  }
  .av-wrap[data-stance='can'] {
    background: rgb(56 189 248 / 0.18);
    border-color: rgb(56 189 248 / 0.7);
  }
  .av-wrap[data-stance='ifNeeded'] {
    background: rgb(245 158 11 / 0.18);
    border-color: rgb(245 158 11 / 0.7);
    border-style: dashed;
  }
  .av-wrap[data-stance='cannot'] {
    background: rgb(148 163 184 / 0.12);
  }
  .av-wrap[data-stance='cannot'] .av-time {
    text-decoration: line-through;
  }
  .av-cell {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.125rem;
    padding: 0.5rem 0.625rem;
    padding-inline-end: 2rem;
    text-align: start;
    color: rgb(var(--surface-ink-rgb));
    min-height: 3rem;
  }
  .av-cell:disabled {
    opacity: 0.6;
  }
  .av-cell:focus-visible,
  .av-star:focus-visible {
    outline: 2px solid var(--gold, #eee8aa);
    outline-offset: 2px;
    border-radius: 0.75rem;
  }
  .av-time {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    direction: ltr;
  }
  .av-stance {
    font-size: 0.875rem;
  }
  .av-meta {
    font-size: 0.75rem;
    opacity: 0.85;
  }
  .av-coming {
    font-weight: 700;
  }
  .av-rule {
    font-style: italic;
  }
  .av-star {
    position: absolute;
    inset-block-start: 0.25rem;
    inset-inline-end: 0.25rem;
    width: 1.75rem;
    height: 1.75rem;
    font-size: 1.125rem;
    line-height: 1;
    color: rgb(var(--surface-ink-rgb));
  }
</style>
