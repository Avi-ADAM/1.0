<script>
  /**
   * One open planning board and its proposed rows
   * (PLAN_PROJECT_PLANNING_BOARDS §4).
   *
   * Every row is a *proposal*. Nothing here creates a real entity — "open in
   * form" hands the row's spec to the normal creation form (mission.svelte /
   * crtask.svelte / ResourceCreator.svelte), where the user reviews and
   * approves it. Only then does the parent call `markPlanItemCreated`.
   */
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import Button from '$lib/celim/ui/button.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} board - Board node: { id, attributes: { title, …, items } }
   * @property {string} projectId
   * @property {'auto'|'always'|'never'} [siteMode] - Whether the expansion run may
   *   read the rikma's website for context. See `src/lib/server/planning/siteContext.ts`.
   * @property {(item: any, board: any) => void} [onOpenItem] - Open the row in its real creation form.
   * @property {() => void} [onChanged] - Ask the parent to reload after a change.
   */

  /** @type {Props} */
  let { board, projectId, siteMode = 'auto', onOpenItem, onChanged } = $props();

  let busyItemId = $state(/** @type {string|null} */ (null));
  let expanding = $state(false);
  let revisionNote = $state('');
  let showRevision = $state(false);
  /**
   * Clarifying questions the run came back with. They live on the action's
   * result rather than on the board, so they are shown for this run only —
   * previously they were returned and silently dropped.
   */
  let hints = $state(/** @type {{kind: string, text: string}[]} */ ([]));
  let siteUsed = $state(/** @type {string|null} */ (null));

  let attrs = $derived(board?.attributes ?? {});
  let items = $derived(attrs.items?.data ?? []);
  let isExpanded = $derived(attrs.status === 'expanded');

  /** Skill names the AI suggested for a row, for display as chips. */
  function skillsOf(item) {
    const raw = item?.attributes?.spec?.skills;
    return Array.isArray(raw) ? raw.filter(Boolean).slice(0, 6) : [];
  }

  /** Why the AI proposed this row, grounded in the rikma's real state. */
  function rationaleOf(item) {
    const raw = item?.attributes?.spec?.rationale;
    return typeof raw === 'string' ? raw.trim() : '';
  }

  async function expand() {
    if (expanding) return;
    expanding = true;
    try {
      const res = await executeAction('expandPlanBoard', {
        boardId: String(board.id),
        projectId: String(projectId),
        lang: $lang,
        siteMode,
        ...(revisionNote.trim() ? { revisionNote: revisionNote.trim() } : {})
      });
      if (res.success) {
        revisionNote = '';
        showRevision = false;
        hints = Array.isArray(res.data?.hints) ? res.data.hints : [];
        siteUsed = res.data?.siteUsed ?? null;
        onChanged?.();
      }
    } finally {
      expanding = false;
    }
  }

  async function patchItem(item, data) {
    if (busyItemId) return;
    busyItemId = String(item.id);
    try {
      const res = await executeAction('updatePlanItem', {
        itemId: String(item.id),
        boardId: String(board.id),
        projectId: String(projectId),
        ...data
      });
      if (res.success) onChanged?.();
    } finally {
      busyItemId = null;
    }
  }

  const toggleImp = (item) =>
    patchItem(item, { imp: item.attributes.imp === 'must' ? 'nice' : 'must' });

  const dismiss = (item) => patchItem(item, { status: 'dismissed' });
  const restore = (item) => patchItem(item, { status: 'proposed' });
</script>

<div class="plan-board rounded-2xl border border-barbi/40 p-4 bg-white/50 dark:bg-black/20">
  {#if attrs.rationale}
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">{attrs.rationale}</p>
  {/if}

  {#if !isExpanded || items.length === 0}
    <p class="text-sm text-gray-500 mb-3">{$t('planning.board.empty')}</p>
    <Button onClick={expand} disabled={expanding}>
      {expanding ? $t('planning.board.expanding') : $t('planning.board.expand')}
    </Button>
  {:else}
    {#if siteUsed}
      <p class="text-xs mb-3 text-gray-600 dark:text-gray-300">
        {$t('planning.board.siteRead')}
        <a class="underline break-all" href={siteUsed} target="_blank" rel="noopener noreferrer">{siteUsed}</a>
      </p>
    {/if}

    {#if hints.length > 0}
      <div class="mb-3 rounded-xl border border-barbi/30 bg-white/60 dark:bg-black/20 p-3">
        <p class="text-xs font-semibold mb-1 text-[color:var(--stgold,#574010)]">{$t('planning.board.hint')}</p>
        <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
          {#each hints as hint (hint.text)}
            <li>{hint.text}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <ul class="flex flex-col gap-3">
      {#each items as item (item.id)}
        {@const a = item.attributes}
        {@const isCreated = a.status === 'created'}
        {@const isDismissed = a.status === 'dismissed'}
        <li
          class="rounded-xl border p-3 transition-opacity {isDismissed
            ? 'opacity-40 border-gray-300'
            : 'border-barbi/30'}"
        >
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">
              {$t(`planning.board.kinds.${a.kind}`)}
            </span>

            <button
              type="button"
              class="text-xs px-2 py-0.5 rounded-full border {a.imp === 'must'
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-gray-100 border-gray-300 text-gray-700'}"
              disabled={isCreated || busyItemId === String(item.id)}
              onclick={() => toggleImp(item)}
            >
              {a.imp === 'must' ? $t('planning.board.must') : $t('planning.board.nice')}
            </button>

            {#if a.existingRef}
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300"
                title={a.existingRef.name}
              >
                {$t('planning.board.exists')}
              </span>
            {/if}

            {#if isCreated}
              <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-900 border border-green-300">
                {$t('planning.board.created')}
              </span>
            {/if}
          </div>

          <p class="font-semibold text-gray-900 dark:text-gray-100">{a.name}</p>
          {#if a.descrip}
            <p class="text-sm text-gray-600 dark:text-gray-300">{a.descrip}</p>
          {/if}
          {#if rationaleOf(item)}
            <p class="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
              {$t('planning.board.why')} {rationaleOf(item)}
            </p>
          {/if}

          {#if skillsOf(item).length > 0}
            <div class="flex flex-wrap gap-1 mt-2">
              {#each skillsOf(item) as skill (skill)}
                <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {skill}
                </span>
              {/each}
            </div>
          {/if}

          {#if !isCreated}
            <div class="flex flex-wrap gap-2 mt-3">
              {#if !isDismissed}
                <Button onClick={() => onOpenItem?.(item, board)}>{$t('planning.board.openInForm')}</Button>
                <button
                  type="button"
                  class="text-sm underline text-gray-500"
                  disabled={busyItemId === String(item.id)}
                  onclick={() => dismiss(item)}
                >
                  {$t('planning.board.dismiss')}
                </button>
              {:else}
                <button
                  type="button"
                  class="text-sm underline text-gray-500"
                  disabled={busyItemId === String(item.id)}
                  onclick={() => restore(item)}
                >
                  {$t('planning.board.restore')}
                </button>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="mt-4">
      {#if showRevision}
        <textarea
          class="w-full rounded-xl border border-barbi/40 p-2 text-sm"
          rows="2"
          bind:value={revisionNote}
          placeholder={$t('planning.board.revisePlaceholder')}
        ></textarea>
        <div class="flex gap-2 mt-2">
          <Button onClick={expand} disabled={expanding || !revisionNote.trim()}>
            {expanding ? $t('planning.board.expanding') : $t('planning.board.reviseSend')}
          </Button>
          <button type="button" class="text-sm underline text-gray-500" onclick={() => (showRevision = false)}>
            {$t('planning.board.cancel')}
          </button>
        </div>
      {:else}
        <button type="button" class="text-sm underline text-gray-500" onclick={() => (showRevision = true)}>
          {$t('planning.board.revise')}
        </button>
      {/if}
    </div>
  {/if}
</div>
