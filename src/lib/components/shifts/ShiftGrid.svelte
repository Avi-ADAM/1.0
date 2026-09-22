<script lang="ts">
  /**
   * The shared shift grid (docs/PLAN_SHIFTS.md §5, §9.2): one column per day
   * of a cycle, each day's shifts stacked in it.
   *
   * Built here rather than on @event-calendar on purpose (§5.2): a shift is a
   * discrete slot with a capacity and a ranked list of people, not a free-form
   * event, and the grid has to be right-to-left, translated and usable on a
   * phone. On a narrow screen the days stack; from `md` up they sit side by
   * side, seven to a row.
   *
   * What goes inside a cell is the host's: the availability grid puts a tap
   * target there, the roster puts names. Times are shown in the plan's zone.
   */
  import type { Snippet } from 'svelte';
  import { locale } from '$lib/translations';
  import { dayLabel, daysOf, localDateKey } from '$lib/shifts/format';

  interface GridShift {
    id: string;
    start: string;
    end: string;
    need: number;
  }

  interface Props {
    shifts: GridShift[];
    timeZone: string;
    cycleStart: string;
    cycleEnd: string;
    /** Accessible name of the whole grid. */
    label: string;
    cell: Snippet<[GridShift]>;
  }

  let { shifts, timeZone, cycleStart, cycleEnd, label, cell }: Props = $props();

  let days = $derived(daysOf(cycleStart, cycleEnd, timeZone));
  let byDay = $derived.by(() => {
    const m = new Map<string, GridShift[]>();
    for (const s of [...shifts].sort((a, b) => a.start.localeCompare(b.start))) {
      const k = localDateKey(s.start, timeZone);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  });
  let columns = $derived(Math.min(7, Math.max(1, days.length)));
</script>

<section class="sg-grid" aria-label={label} style="--sg-cols: {columns}">
  {#each days as day (day)}
    <section class="sg-day rounded-xl border border-surfaceLine bg-surface2/60 p-2" aria-label={dayLabel(day, $locale || 'he')}>
      <h3 class="sg-dayhead mb-2 text-sm font-bold text-surfaceInk">{dayLabel(day, $locale || 'he')}</h3>
      <ul class="flex flex-col gap-2">
        {#each byDay.get(day) ?? [] as s (s.id)}
          <li>{@render cell(s)}</li>
        {:else}
          <li class="text-center text-xs text-surfaceMuted">—</li>
        {/each}
      </ul>
    </section>
  {/each}
</section>

<style>
  .sg-grid {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: minmax(0, 1fr);
  }
  @media (min-width: 768px) {
    .sg-grid {
      grid-template-columns: repeat(var(--sg-cols), minmax(0, 1fr));
    }
  }
</style>
