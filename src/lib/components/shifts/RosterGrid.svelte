<script lang="ts">
  /**
   * The roster for one cycle (docs/PLAN_SHIFTS.md §6.7, §9.2): who comes, who
   * is next in line, and where nobody is coming yet.
   *
   * Each name carries the reason it is there (§1.5) — shown on hover and read
   * out to screen readers — because a roster nobody can explain is a roster
   * nobody agreed to.
   */
  import { t, locale } from '$lib/translations';
  import { coverageOf } from '$lib/shifts/coverage';
  import { reasonKey } from '$lib/shifts/explain';
  import { timeRange } from '$lib/shifts/format';
  import type { AssignmentLike } from '$lib/shifts/types';
  import ShiftGrid from './ShiftGrid.svelte';

  interface Shift {
    id: string;
    start: string;
    end: string;
    need: number;
    state?: 'open' | 'rostered' | 'running' | 'done' | 'cancelled' | null;
  }

  interface Props {
    shifts: Shift[];
    assignments: AssignmentLike[];
    /** userId → display name. */
    names: Record<string, string>;
    /** The viewer, highlighted wherever they appear. */
    uid: string;
    timeZone: string;
    cycleStart: string;
    cycleEnd: string;
    /** How many backups to show before collapsing to "+N". */
    showBackups?: number;
  }

  let { shifts, assignments, names, uid, timeZone, cycleStart, cycleEnd, showBackups = 3 }: Props = $props();

  let open = $derived(shifts.filter((s) => s.state !== 'cancelled'));
  const nameOf = (id: string) => (id === uid ? $t('shifts.roster.you') : names[id] || `#${id}`);
</script>

<ShiftGrid shifts={open} {timeZone} {cycleStart} {cycleEnd} label={$t('shifts.tabs.roster')}>
  {#snippet cell(s)}
    {@const cov = coverageOf(s, assignments)}
    <article class="rg-cell" data-status={cov.status}>
      <header class="flex items-center justify-between gap-2">
        <span class="rg-time">{timeRange(s.start, s.end, timeZone, $locale || 'he')}</span>
        {#if cov.missing > 0}
          <span class="rg-missing">{$t('shifts.roster.missing', { count: cov.missing })}</span>
        {:else if s.need > 1}
          <span class="text-xs opacity-80">{$t('shifts.grid.need', { count: s.need })}</span>
        {/if}
      </header>
      {#if cov.coming.length}
        <ul class="mt-1 flex flex-col gap-0.5" aria-label={$t('shifts.roster.coming')}>
          {#each cov.coming as a (a.userId)}
            <li class="rg-name" class:rg-you={a.userId === uid} title={$t(reasonKey(a.reason))}>
              {nameOf(a.userId)}
              <span class="sr-only">— {$t(reasonKey(a.reason))}</span>
            </li>
          {/each}
        </ul>
      {:else if cov.missing === 0}
        <p class="mt-1 text-xs text-surfaceMuted">{$t('shifts.roster.empty')}</p>
      {/if}
      {#if cov.backups.length}
        <p class="mt-1 text-xs text-surfaceMuted">
          {$t('shifts.roster.backups')}:
          {#each cov.backups.slice(0, showBackups) as b, i (b.userId)}
            <span class:rg-you={b.userId === uid}>{i > 0 ? ', ' : ''}{nameOf(b.userId)}</span>
          {/each}
          {#if cov.backups.length > showBackups}
            <span>{$t('shifts.roster.more', { count: cov.backups.length - showBackups })}</span>
          {/if}
        </p>
      {/if}
    </article>
  {/snippet}
</ShiftGrid>

<style>
  .rg-cell {
    border-radius: 0.75rem;
    border: 1px solid var(--surface-line);
    padding: 0.5rem 0.625rem;
    color: rgb(var(--surface-ink-rgb));
    background: rgb(var(--surface-rgb, 255 255 255) / 0.6);
  }
  .rg-cell[data-status='empty'],
  .rg-cell[data-status='short'] {
    border-color: rgb(239 68 68 / 0.8);
    border-width: 2px;
  }
  .rg-time {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    direction: ltr;
  }
  .rg-missing {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgb(185 28 28);
    background: rgb(254 226 226);
    border-radius: 9999px;
    padding: 0 0.5rem;
  }
  .rg-name {
    font-size: 0.875rem;
  }
  .rg-you {
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
