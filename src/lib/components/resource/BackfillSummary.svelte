<script>
  /**
   * The past cycles a recurring resource was proposed with, as the voters see
   * them: how many, what they add up to, and the month-by-month table one tap
   * away. Approving the resource approves these too ($lib/recurring/backfill).
   */
  import Money from '$lib/components/money/Money.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { readBackfillEntries, backfillTotal } from '$lib/recurring/backfill';

  /**
   * @typedef {Object} Props
   * @property {unknown} backfill - `{ cycles: [{ key, amount }] }` as stored on the request
   * @property {string} [kindOf] - 'monthly' | 'yearly'
   * @property {string|number} [projectId]
   */

  /** @type {Props} */
  let { backfill, kindOf = 'monthly', projectId } = $props();

  const cycles = $derived(
    readBackfillEntries(backfill)
      .filter((c) => c.amount > 0)
      .sort((a, b) => a.key.localeCompare(b.key))
  );
  const total = $derived(backfillTotal(cycles));
  const yearly = $derived(kindOf === 'yearly');

  /** @param {string} key */
  function label(key) {
    const [y, m] = key.split('-').map(Number);
    if (yearly) return String(y);
    return new Date(y, m - 1, 1).toLocaleDateString($lang || undefined, { month: 'short', year: 'numeric' });
  }
</script>

{#if cycles.length > 0}
  <div class="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20">
    <div class="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
      <span aria-hidden="true">📅</span>
      <span>
        {yearly
          ? $t('lev.rektom.backfillTitleYears', { count: cycles.length })
          : $t('lev.rektom.backfillTitle', { count: cycles.length })}
      </span>
    </div>
    <div class="text-sm text-gray-700 dark:text-gray-200">
      {$t('lev.rektom.backfillTotal')}
      <span class="font-black text-gray-900 dark:text-white"><Money amount={total} {projectId} /></span>
    </div>
    <details class="text-sm">
      <summary class="min-h-8 cursor-pointer text-gray-700 underline dark:text-gray-200">
        {$t('lev.rektom.backfillShow')}
      </summary>
      <ul class="m-0 mt-1 grid list-none grid-cols-2 gap-x-4 gap-y-0.5 p-0 sm:grid-cols-3">
        {#each cycles as c (c.key)}
          <li class="flex justify-between gap-2 tabular-nums text-gray-800 dark:text-gray-100">
            <span>{label(c.key)}</span>
            <Money amount={c.amount} {projectId} />
          </li>
        {/each}
      </ul>
    </details>
    <div class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.rektom.backfillNote')}</div>
  </div>
{/if}
