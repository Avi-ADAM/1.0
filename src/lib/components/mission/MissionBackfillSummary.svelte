<script>
  /**
   * The past months a recurring mission was proposed with, as the voters see
   * them: how many, what they add up to, and the month-by-month table one tap
   * away. Approving the mission approves these too ($lib/recurring/missionBackfill).
   *
   * It reads the table itself, by the offer's id, so that the big queries behind
   * the heart page do not have to know about a field only a few offers carry.
   */
  import Money from '$lib/components/money/Money.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { readBackfillEntries } from '$lib/recurring/backfill';
  import { missionBackfillBook } from '$lib/recurring/missionBackfill';
  import { sendToSer } from '$lib/send/sendToSer.js';

  /**
   * @typedef {Object} Props
   * @property {string|number} openMissionId
   * @property {number} [perhour] - the standing hourly value
   * @property {string|number} [projectId]
   */

  /** @type {Props} */
  let { openMissionId, perhour = 0, projectId } = $props();

  /** @type {unknown} */
  let backfill = $state(null);

  $effect(() => {
    const id = String(openMissionId);
    let current = true;
    sendToSer({ id }, 'getOpenMissionBackfill', 0, 0, false, fetch, { silent: true })
      .then((res) => {
        if (current) backfill = res?.data?.openMission?.data?.attributes?.backfill ?? null;
      })
      .catch(() => {
        if (current) backfill = null;
      });
    return () => {
      current = false;
    };
  });

  const months = $derived(
    readBackfillEntries(backfill)
      .filter((c) => c.amount > 0)
      .sort((a, b) => a.key.localeCompare(b.key))
  );
  const book = $derived(missionBackfillBook(months, perhour));

  /** @param {string} key */
  function label(key) {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString($lang || undefined, { month: 'short', year: 'numeric' });
  }
</script>

{#if months.length > 0}
  <div class="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20">
    <div class="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
      <span aria-hidden="true">📅</span>
      <span>{$t('lev.rektom.missionBackfillTitle', { count: months.length })}</span>
    </div>
    <div class="text-sm text-gray-700 dark:text-gray-200">
      {$t('lev.rektom.backfillMissionTotal', { hours: book.hours })}
      <span class="font-black text-gray-900 dark:text-white"><Money amount={book.value} {projectId} /></span>
    </div>
    <details class="text-sm">
      <summary class="min-h-8 cursor-pointer text-gray-700 underline dark:text-gray-200">
        {$t('lev.rektom.backfillShow')}
      </summary>
      <ul class="m-0 mt-1 grid list-none grid-cols-2 gap-x-4 gap-y-0.5 p-0 sm:grid-cols-3">
        {#each months as c (c.key)}
          <li class="flex justify-between gap-2 tabular-nums text-gray-800 dark:text-gray-100">
            <span>{label(c.key)}</span>
            <span>{c.amount}</span>
          </li>
        {/each}
      </ul>
    </details>
    <div class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.rektom.missionBackfillNote')}</div>
  </div>
{/if}
