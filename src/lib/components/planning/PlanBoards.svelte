<script>
  /**
   * Planning boards for a project (PLAN_PROJECT_PLANNING_BOARDS §4).
   *
   * Three entry points, all explicitly user-triggered — **nothing runs
   * automatically**:
   *  1. "What's worth advancing?" → the thin quick scan (tier 1), which
   *     proposes a few directions as suggested boards with no items.
   *  2. Accepting a direction → the big expansion run (tier 2), inside
   *     PlanBoard.
   *  3. Free text → a board that arrives already expanded.
   *
   * Boards are loaded lazily on the client rather than in the page's server
   * load, so this feature cannot break the create page if the Strapi schema
   * has not been deployed yet — it simply stays hidden.
   */
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { executeAction } from '$lib/client/actionClient';
  import Button from '$lib/celim/ui/button.svelte';
  import PlanBoard from './PlanBoard.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} projectId
   * @property {(item: any, board: any) => void} [onOpenItem] - Open a row in its real creation form.
   * @property {string|null} [initialBoardId] - Board to open on load. Set from the
   *   `?board=` deep link that planProjectWorkTool hands back as its reviewUrl.
   */

  /** @type {Props} */
  let { projectId, onOpenItem, initialBoardId = null } = $props();

  let boards = $state(/** @type {any[]} */ ([]));
  let loading = $state(true);
  /** True when the backend does not know these types yet (schema not deployed). */
  let unavailable = $state(false);
  let scanning = $state(false);
  let scanned = $state(false);
  let freeText = $state('');
  let submittingText = $state(false);
  let openBoardId = $state(/** @type {string|null} */ (null));

  /**
   * May the planner read the rikma's own website?
   *
   * On by default, but that does NOT mean the site is fetched every run: the
   * server treats this as `siteMode:'auto'` and only reads the site when the
   * rikma's own description is too thin to plan from. Unticking sends
   * `'never'`. See `src/lib/server/planning/siteContext.ts`.
   */
  let allowSite = $state(true);
  let siteMode = $derived(/** @type {'auto'|'never'} */ (allowSite ? 'auto' : 'never'));
  /** The URL a run actually read, so "it looked at our site" is visible. */
  let siteUsed = $state(/** @type {string|null} */ (null));

  // Sync the deep link into local state. Not a plain initialiser: `?board=`
  // can arrive through client-side navigation (the bot hands the user a
  // reviewUrl), and a plain $state() would only capture the first value.
  $effect(() => {
    if (initialBoardId) openBoardId = String(initialBoardId);
  });

  let suggested = $derived(boards.filter((b) => b.attributes?.status === 'suggested'));
  let opened = $derived(boards.filter((b) => b.attributes?.status !== 'suggested'));

  export async function reload() {
    try {
      const res = await sendToSer(
        { pid: String(projectId) },
        '285getProjectPlanBoards',
        0,
        0,
        false,
        fetch
      );
      const data = res?.data?.projectPlanBoards?.data;
      if (!data) {
        // No data and no throw usually means the backend does not know these
        // types yet — hide the feature instead of showing a broken panel.
        unavailable = true;
        boards = [];
        return;
      }
      unavailable = false;
      boards = data;
    } catch (err) {
      console.warn('[PlanBoards] could not load boards:', err);
      unavailable = true;
      boards = [];
    } finally {
      loading = false;
    }
  }

  onMount(reload);

  async function runScan() {
    if (scanning) return;
    scanning = true;
    try {
      const res = await executeAction('scanProjectDirections', {
        projectId: String(projectId),
        lang: $lang,
        siteMode
      });
      if (res.success) {
        scanned = true;
        siteUsed = res.data?.siteUsed ?? null;
        await reload();
      }
    } finally {
      scanning = false;
    }
  }

  async function submitFreeText() {
    const text = freeText.trim();
    if (text.length < 20 || submittingText) return;
    submittingText = true;
    try {
      const res = await executeAction('createPlanBoardFromText', {
        projectId: String(projectId),
        text,
        lang: $lang,
        siteMode
      });
      if (res.success) {
        freeText = '';
        siteUsed = res.data?.siteUsed ?? null;
        await reload();
        if (res.data?.boardId) openBoardId = String(res.data.boardId);
      }
    } finally {
      submittingText = false;
    }
  }

  async function setBoardStatus(board, status) {
    const res = await executeAction('updatePlanBoard', {
      boardId: String(board.id),
      projectId: String(projectId),
      status
    });
    if (res.success) await reload();
  }

  /** Accepting a direction opens it; PlanBoard then offers the expansion run. */
  async function acceptDirection(board) {
    await setBoardStatus(board, 'active');
    openBoardId = String(board.id);
  }
</script>

{#if !loading && !unavailable}
  <section
    id="ai-planning-boards"
    class="plan-boards scroll-mt-20 max-w-3xl mx-auto my-8 p-4 rounded-2xl border border-barbi bg-gradient-to-br from-gra via-grb to-gre"
  >
    <div class="inline-flex items-center gap-1.5 mb-1">
      <span class="w-1.5 h-1.5 rounded-full bg-barbi animate-pulse"></span>
      <span class="text-xs font-semibold tracking-wide uppercase text-[color:var(--stgold,#574010)]">
        {$t('planning.boards.aiBadge')}
      </span>
    </div>
    <h2 class="text-xl font-bold text-[color:var(--stgold,#574010)]">{$t('planning.boards.heading')}</h2>
    <p class="text-sm font-medium mb-4 text-[color:var(--stgold,#574010)]">{$t('planning.boards.intro')}</p>

    <!-- Tier 1 — the thin scan. Explicit click only. -->
    <div class="flex flex-wrap items-center gap-3 mb-2">
      <Button onClick={runScan} disabled={scanning}>
        {scanning ? $t('planning.boards.scanning') : scanned ? $t('planning.boards.rescan') : $t('planning.boards.scan')}
      </Button>
      {#if scanned && suggested.length === 0 && !scanning}
        <span class="text-sm font-medium text-[color:var(--stgold,#574010)]">{$t('planning.boards.noDirections')}</span>
      {/if}
    </div>

    <!-- Website analysis: permission, not a command — the server still reads
         the site only when the rikma's own description is too thin. -->
    <label class="flex items-start gap-2 mb-4 text-sm text-[color:var(--stgold,#574010)] cursor-pointer">
      <input type="checkbox" bind:checked={allowSite} class="mt-0.5 accent-barbi" />
      <span>
        {$t('planning.boards.useSite')}
        <span class="block text-xs opacity-80">{$t('planning.boards.useSiteHelp')}</span>
      </span>
    </label>

    {#if siteUsed}
      <p class="text-xs mb-4 text-[color:var(--stgold,#574010)]">
        {$t('planning.boards.siteRead')}
        <a class="underline break-all" href={siteUsed} target="_blank" rel="noopener noreferrer">{siteUsed}</a>
      </p>
    {/if}

    <!-- Suggested directions: thin cards, nothing expanded yet -->
    {#if suggested.length > 0}
      <ul class="flex flex-col gap-3 mb-6">
        {#each suggested as board (board.id)}
          {@const a = board.attributes}
          <li class="rounded-xl border border-barbi/40 p-3 bg-white/50 dark:bg-black/20">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">{$t('planning.boards.suggested')}</span>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
            </div>
            {#if a.descrip}<p class="text-sm text-gray-700 dark:text-gray-300">{a.descrip}</p>{/if}
            {#if a.rationale}
              <p class="text-sm text-gray-600 dark:text-gray-300 italic mt-1">{a.rationale}</p>
            {/if}
            <div class="flex gap-2 mt-3">
              <Button onClick={() => acceptDirection(board)}>{$t('planning.boards.open')}</Button>
              <button
                type="button"
                class="text-sm underline text-gray-500"
                onclick={() => setBoardStatus(board, 'archived')}
              >
                {$t('planning.boards.dismissDirection')}
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Boards the user has taken on -->
    {#if opened.length > 0}
      <ul class="flex flex-col gap-3 mb-6">
        {#each opened as board (board.id)}
          {@const isOpen = openBoardId === String(board.id)}
          <li>
            <button
              type="button"
              class="w-full text-start font-semibold flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/40"
              onclick={() => (openBoardId = isOpen ? null : String(board.id))}
            >
              <span class="text-[color:var(--stgold,#574010)]">{board.attributes?.title}</span>
              <span class="text-xs text-gray-500">{isOpen ? $t('planning.boards.close') : $t('planning.boards.open')}</span>
            </button>
            {#if isOpen}
              <div class="mt-2">
                <PlanBoard {board} {projectId} {siteMode} {onOpenItem} onChanged={reload} />
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if suggested.length === 0 && !scanning}
      <p class="text-sm font-medium mb-4 text-[color:var(--stgold,#574010)]">{$t('planning.boards.empty')}</p>
    {/if}

    <!-- Free text entry -->
    <div>
      <label class="block text-sm font-medium mb-1" for="plan-free-text">{$t('planning.boards.freeTextLabel')}</label>
      <textarea
        id="plan-free-text"
        class="w-full rounded-xl border border-barbi/40 p-2 text-sm"
        rows="3"
        bind:value={freeText}
        placeholder={$t('planning.boards.freeTextPlaceholder')}
      ></textarea>
      <div class="flex items-center gap-3 mt-2">
        <Button onClick={submitFreeText} disabled={submittingText || freeText.trim().length < 20}>
          {submittingText ? $t('planning.boards.sending') : $t('planning.boards.freeTextSend')}
        </Button>
        {#if freeText.trim().length > 0 && freeText.trim().length < 20}
          <span class="text-xs font-medium text-[color:var(--stgold,#574010)]">{$t('planning.boards.tooShort')}</span>
        {/if}
      </div>
    </div>
  </section>
{/if}
