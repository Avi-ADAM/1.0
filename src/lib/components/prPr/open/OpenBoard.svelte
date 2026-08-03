<script>
  /**
   * "Open for partners" — every mission and every needed resource of one rikma
   * that is still looking for someone, in one place.
   *
   * Used twice: as the whole `/moach/[projectId]/open` page (`only="all"`), and
   * inside the create page's two panels (`only="missions"` / `only="resources"`),
   * so the two entry points can never drift apart again.
   *
   * Proposals still awaiting a vote (`pendms`, `pmashes`) are a separate,
   * opt-in section — they are not yet open to anyone outside the rikma.
   */
  import { t, isRtl } from '$lib/translations';
  import { htmlExcerpt } from '$lib/text/htmlExcerpt';
  import OpenMissionCard from './OpenMissionCard.svelte';
  import OpenResourceCard from './OpenResourceCard.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} projectId
   * @property {string} [projectName]
   * @property {any[]} [missions] - open_missions nodes
   * @property {any[]} [pendms] - mission proposals awaiting a vote
   * @property {any[]} [resources] - open_mashaabims nodes
   * @property {any[]} [pmashes] - resource proposals awaiting a vote
   * @property {'all'|'missions'|'resources'} [only]
   * @property {boolean} [showHeader]
   * @property {boolean} [linkToFullBoard] - show the "open the full board" link
   */

  /** @type {Props} */
  let {
    projectId,
    projectName = '',
    missions = [],
    pendms = [],
    resources = [],
    pmashes = [],
    only = 'all',
    showHeader = true,
    linkToFullBoard = false
  } = $props();

  let search = $state('');
  let kind = $state(/** @type {'all'|'missions'|'resources'} */ ('all'));
  let showPending = $state(false);

  /** The board can be locked to one kind by its host — then the tabs are pointless. */
  let effectiveKind = $derived(only === 'all' ? kind : only);

  /** Everything a mission/resource can be searched by, lower-cased once. */
  function missionHaystack(n) {
    const a = n?.attributes ?? {};
    return [
      a.name,
      htmlExcerpt(a.descrip, 4000),
      htmlExcerpt(a.hearotMeyuchadot, 2000),
      ...(a.skills?.data ?? []).map((s) => s.attributes?.skillName),
      ...(a.tafkidims?.data ?? []).map((r) => r.attributes?.roleDescription),
      ...(a.work_ways?.data ?? []).map((w) => w.attributes?.workWayName)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function resourceHaystack(n) {
    const a = n?.attributes ?? {};
    return [a.name, htmlExcerpt(a.descrip, 4000), a.kindOf, htmlExcerpt(a.spnot, 2000)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  let q = $derived(search.trim().toLowerCase());

  const byQuery = (nodes, haystack, query) =>
    !query ? nodes : nodes.filter((n) => haystack(n).includes(query));

  let shownMissions = $derived(byQuery(missions, missionHaystack, q));
  let shownPendms = $derived(byQuery(pendms, missionHaystack, q));
  let shownResources = $derived(byQuery(resources, resourceHaystack, q));
  let shownPmashes = $derived(byQuery(pmashes, resourceHaystack, q));

  let showMissions = $derived(effectiveKind === 'all' || effectiveKind === 'missions');
  let showResources = $derived(effectiveKind === 'all' || effectiveKind === 'resources');

  let openCount = $derived(missions.length + resources.length);
  let pendingCount = $derived(pendms.length + pmashes.length);

  let visibleCount = $derived(
    (showMissions ? shownMissions.length : 0) +
      (showResources ? shownResources.length : 0) +
      (showPending ? (showMissions ? shownPendms.length : 0) + (showResources ? shownPmashes.length : 0) : 0)
  );

  /** Nothing published at all (as opposed to: the search hid everything). */
  let isEmpty = $derived(
    (showMissions ? missions.length : 0) + (showResources ? resources.length : 0) === 0
  );
</script>

<section class="open-board flex flex-col gap-4" dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if showHeader}
    <header class="text-start">
      <h1 class="text-2xl font-bold text-gold">🤝 {$t('moach.open.title')}</h1>
      <p class="mt-1 text-sm text-slate-300">{$t('moach.open.subtitle')}</p>
    </header>
  {/if}

  <div class="flex flex-wrap items-center gap-2">
    <input
      type="search"
      bind:value={search}
      placeholder={$t('moach.open.searchPh')}
      class="min-w-[12rem] flex-1 rounded-full border border-gold/50 bg-slate-800/80 px-4 py-1.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-gold focus:outline-none"
    />

    {#if only === 'all'}
      <div class="flex flex-wrap gap-1.5" role="group" aria-label={$t('moach.open.title')}>
        <button
          type="button"
          class="chip"
          class:active={kind === 'all'}
          onclick={() => (kind = 'all')}
        >
          {$t('moach.open.tabAll')} <span class="opacity-60">{openCount}</span>
        </button>
        <button
          type="button"
          class="chip"
          class:active={kind === 'missions'}
          onclick={() => (kind = 'missions')}
        >
          🛠️ {$t('moach.open.tabMissions')} <span class="opacity-60">{missions.length}</span>
        </button>
        <button
          type="button"
          class="chip"
          class:active={kind === 'resources'}
          onclick={() => (kind = 'resources')}
        >
          📦 {$t('moach.open.tabResources')} <span class="opacity-60">{resources.length}</span>
        </button>
      </div>
    {/if}

    {#if pendingCount > 0}
      <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
        <input type="checkbox" bind:checked={showPending} class="accent-[color:var(--barbi-pink)]" />
        {$t('moach.open.pendingToggle')} <span class="opacity-60">({pendingCount})</span>
      </label>
    {/if}

    {#if linkToFullBoard}
      <a
        href="/moach/{projectId}/open"
        class="ms-auto rounded-full border border-gold px-3 py-1 text-xs font-bold text-gold hover:bg-gold hover:text-slate-900"
      >
        {$t('moach.open.fullBoard')} →
      </a>
    {/if}
  </div>

  {#if isEmpty}
    <div class="rounded-2xl border border-dashed border-gold/40 bg-slate-900/50 p-8 text-center">
      <p class="text-slate-300">{$t('moach.open.empty')}</p>
      <a
        href="/moach/{projectId}/create"
        class="mt-3 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-bold text-slate-900 hover:bg-barbi hover:text-gold"
      >
        + {$t('moach.open.emptyCta')}
      </a>
    </div>
  {:else if visibleCount === 0}
    <p class="py-6 text-center text-sm text-slate-400">{$t('moach.open.emptyFiltered')}</p>
  {/if}

  {#if showMissions && shownMissions.length}
    <div class="flex flex-col gap-2">
      {#if effectiveKind === 'all'}
        <h2 class="text-start text-sm font-bold uppercase tracking-wide text-gold-l">
          🛠️ {$t('moach.open.missionsHeading')} <span class="opacity-60">({shownMissions.length})</span>
        </h2>
      {/if}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each shownMissions as node (node.id)}
          <OpenMissionCard {node} {projectId} {projectName} />
        {/each}
      </div>
    </div>
  {/if}

  {#if showResources && shownResources.length}
    <div class="flex flex-col gap-2">
      {#if effectiveKind === 'all'}
        <h2 class="text-start text-sm font-bold uppercase tracking-wide text-gold-l">
          📦 {$t('moach.open.resourcesHeading')} <span class="opacity-60">({shownResources.length})</span>
        </h2>
      {/if}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each shownResources as node (node.id)}
          <OpenResourceCard {node} {projectId} {projectName} />
        {/each}
      </div>
    </div>
  {/if}

  {#if showPending && ((showMissions && shownPendms.length) || (showResources && shownPmashes.length))}
    <div class="flex flex-col gap-2 border-t border-slate-600/60 pt-4">
      <h2 class="text-start text-sm font-bold uppercase tracking-wide text-mturk">
        ⏳ {$t('moach.open.pendingHeading')}
      </h2>
      <p class="text-start text-xs text-slate-400">{$t('moach.open.pendingNote')}</p>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#if showMissions}
          {#each shownPendms as node (node.id)}
            <OpenMissionCard {node} {projectId} {projectName} pending={true} />
          {/each}
        {/if}
        {#if showResources}
          {#each shownPmashes as node (node.id)}
            <OpenResourceCard {node} {projectId} {projectName} pending={true} />
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .chip {
    border: 1px solid rgba(238, 232, 170, 0.4);
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    color: var(--gold);
    background: rgba(15, 23, 42, 0.7);
    transition: all 0.15s ease;
  }
  .chip:hover {
    border-color: var(--gold);
  }
  .chip.active {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: var(--gold);
    font-weight: 700;
  }
  .text-gold-l {
    color: var(--gold-l, #f0c040);
  }
</style>
