<script module>
  import { executeAction } from '$lib/client/actionClient';

  /**
   * @typedef {import('$lib/shifts/types').ShiftPattern} ShiftPattern
   * @typedef {{ enabled: boolean, pattern: ShiftPattern | null, at?: string | null }} ShiftTerms
   * @typedef {{ pattern: ShiftPattern | null, previous: ShiftTerms | null }} PendmPlan
   */

  /** @type {Map<string, Promise<PendmPlan>>} */
  const cache = new Map();
  /** Bumped when a round changes a proposal's hours, so every card re-reads. */
  let generation = $state(0);

  /**
   * The staffing plan a proposal carries, and the hours before the last round
   * that changed them. One read per proposal: the heart re-mounts cards as the
   * swiper moves. A failure is dropped from the cache so a later mount retries.
   * @param {string} pendId
   * @param {string} projectId
   * @returns {Promise<PendmPlan>}
   */
  export function loadPendmPlan(pendId, projectId) {
    let p = cache.get(pendId);
    if (!p) {
      p = executeAction('getPendmShiftPlan', { pendmId: pendId, projectId })
        .then((res) =>
          res?.success
            ? { pattern: res.data?.plan?.pattern ?? null, previous: res.data?.previous ?? null }
            : Promise.reject(res)
        )
        .catch(() => {
          cache.delete(pendId);
          return { pattern: null, previous: null };
        });
      cache.set(pendId, p);
    }
    return p;
  }

  /** A negotiation round changed this proposal's hours: read them again. */
  export function forgetPendmPlan(pendId) {
    cache.delete(String(pendId));
    generation++;
  }
</script>

<script>
  /**
   * PendmStaffing — what a mission proposal asks for in people and hours
   * (docs/inprogress/PLAN_SHIFTS.md §2, §13.6), shown where the rikma votes on
   * it: the heart's vote card and the negotiation form.
   *
   * The headcount and the staffing plan are approved in the same vote as the
   * mission, so a voter must see them there — and, when a negotiation round
   * changed the hours, what they were before it. The plan lives in its own
   * collection (`shift-plan`, paused on the pendm) and is read on demand.
   */
  import { t, locale } from '$lib/translations';
  import { weeklyStaffedHours } from '$lib/shifts/pattern';

  /**
   * @typedef {Object} Props
   * @property {string|number} pendId - the mission proposal (pendm)
   * @property {string|number} projectId
   * @property {number} [howMeny] - how many people the mission needs
   * @property {boolean} [isshift] - the proposal carries a staffing plan
   * @property {boolean} [compact] - tighter spacing (negotiation form)
   * @property {boolean} [showHours] - list the hours (off where a form edits them)
   */

  /** @type {Props} */
  let { pendId, projectId, howMeny = 1, isshift = false, compact = false, showHours = true } = $props();

  const need = $derived(Math.max(1, Math.floor(Number(howMeny) || 1)));

  /** @type {PendmPlan} */
  let plan = $state({ pattern: null, previous: null });

  $effect(() => {
    void generation;
    if (!isshift || !pendId || !projectId) {
      plan = { pattern: null, previous: null };
      return;
    }
    let cancelled = false;
    loadPendmPlan(String(pendId), String(projectId)).then((p) => {
      if (!cancelled) plan = p;
    });
    return () => {
      cancelled = true;
    };
  });

  /** Staffed days in week order. */
  function daysOf(/** @type {ShiftPattern | null} */ p) {
    return [...(p?.days ?? [])]
      .filter((d) => (d.windows ?? []).length > 0)
      .sort((a, b) => (a.week ?? -1) - (b.week ?? -1) || a.dow - b.dow);
  }

  /** Weekday name in the reader's language; 2024-01-07 was a Sunday (dow 0). */
  function weekday(dow, loc) {
    try {
      return new Intl.DateTimeFormat(loc || 'he', { weekday: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, 0, 7 + dow))
      );
    } catch {
      return String(dow);
    }
  }

  const fmtHours = (/** @type {number} */ n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
</script>

{#snippet hours(/** @type {ShiftPattern} */ p)}
  {@const multiWeek = (p?.weeks ?? 1) > 1}
  {@const weekly = weeklyStaffedHours(p)}
  <ul class="space-y-1">
    {#each daysOf(p) as d (`${d.week ?? ''}-${d.dow}`)}
      <li class="flex flex-wrap items-baseline gap-x-2">
        <span class="min-w-[4.5rem] font-semibold">
          {weekday(d.dow, $locale)}{#if multiWeek && d.week != null}
            · {$t('shifts.pendm.week', { count: d.week + 1 })}{/if}
        </span>
        <span class="flex flex-wrap gap-x-3">
          {#each d.windows as w, i (i)}
            <span dir="ltr" class="tabular-nums">{w.start}–{w.end}</span>
            {#if w.need > 1}
              <span class="opacity-80">({$t('shifts.pendm.atOnce', { count: w.need })})</span>
            {/if}
          {/each}
        </span>
      </li>
    {/each}
  </ul>
  {#if (p?.exceptions ?? []).length > 0}
    <p class="mt-1 text-xs opacity-80">
      {$t('shifts.pendm.exceptions', { count: p?.exceptions?.length ?? 0 })}
    </p>
  {/if}
  {#if weekly > 0}
    <p class="mt-1 text-sm font-semibold">
      {$t('shifts.form.weeklyHours', { hours: fmtHours(weekly) })}
    </p>
  {/if}
{/snippet}

{#if isshift || need > 1}
  <div
    class="rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-100 {compact
      ? 'p-2 text-sm'
      : 'p-3 sm:p-4'} space-y-2"
  >
    <div class="flex flex-wrap items-center gap-2 font-semibold">
      {#if isshift}
        <span
          class="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white"
        >
          🗓 {$t('shifts.pendm.badge')}
        </span>
      {/if}
      {#if plan.previous}
        <span
          class="inline-flex items-center rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900"
        >
          {$t('shifts.pendm.changed')}
        </span>
      {/if}
      <span>👥 {need > 1 ? $t('shifts.pendm.need', { count: need }) : $t('shifts.pendm.needOne')}</span>
    </div>

    {#if showHours && isshift && plan.pattern && daysOf(plan.pattern).length > 0}
      <div>
        <p class="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
          {$t('shifts.pendm.hoursTitle')}
        </p>
        {@render hours(plan.pattern)}
      </div>
    {/if}

    {#if plan.previous}
      <details class="rounded-lg bg-white/60 p-2 text-sm dark:bg-black/20">
        <summary class="cursor-pointer font-semibold">{$t('shifts.pendm.previousTitle')}</summary>
        <div class="mt-1 opacity-90">
          {#if plan.previous.enabled && plan.previous.pattern}
            {@render hours(plan.previous.pattern)}
          {:else}
            <p>{$t('shifts.pendm.previousOff')}</p>
          {/if}
        </div>
      </details>
    {/if}
  </div>
{/if}
