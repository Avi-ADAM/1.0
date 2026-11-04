<script lang="ts">
  /**
   * "In progress" (docs/inprogress/PLAN_LEADS.md §4.1) — every open deal
   * before money in one table: leads, orders waiting for payment that no lead
   * points to, and concierge proposals. Each row opens in its own place; a
   * proposal's consent and silence clock stay in the concierge flow.
   *
   * The data is the manage layout's streamed `pipeline` plus its orders, so
   * the "needs attention" card and this tab never disagree.
   */
  import { page } from '$app/state';
  import { goto, invalidate } from '$app/navigation';
  import { t, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { shopOrdersKey } from '$lib/shop/keys.js';
  import { shownStatus } from '$lib/shop/pendingMarks.svelte';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import {
    buildPipeline,
    DEFAULT_PIPELINE_FILTER,
    filterPipeline,
    orderInput,
    pipelineCounts,
    type OwnerFilter,
    type PipelineData,
    type PipelineRow,
    type StageFilter
  } from '$lib/leads/pipeline';
  import { DEFAULT_LEAD_SETTINGS } from '$lib/leads/settings';
  import { STAGE_CHIP, STAGE_FILTERS } from '$lib/leads/display';
  import type { ShopOrder } from '$lib/shop/manage';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';
  import ShopSheet from '$lib/components/shop/ShopSheet.svelte';
  import NewLeadForm from '$lib/components/leads/NewLeadForm.svelte';
  import LeadLogForm from '$lib/components/leads/LeadLogForm.svelte';
  import LeadPauseForm from '$lib/components/leads/LeadPauseForm.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();

  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let uid = $derived<string | null>(data.uid ?? null);

  let pipeline = $state<PipelineData | null>(null);
  let loaded = $state(false);
  $effect(() => {
    const p = data.pipeline;
    let live = true;
    Promise.resolve(p).then((r) => {
      if (!live) return;
      pipeline = r ?? null;
      loaded = true;
    });
    return () => {
      live = false;
    };
  });

  /** Taken in this tab before the task sync wrote the owner back. */
  let takenHere = $state<Record<string, true>>({});

  let orders = $derived<ShopOrder[]>(data.shop?.orders ?? []);
  let rows = $derived.by(() => {
    if (!pipeline?.ready) return [] as PipelineRow[];
    const built = buildPipeline(
      {
        leads: pipeline.leads,
        proposals: pipeline.proposals,
        orders: orders.map((o) => orderInput({ ...o, status: shownStatus(o) }))
      },
      clock.minutes,
      pipeline.settings ?? DEFAULT_LEAD_SETTINGS
    );
    return built.map((r) => (takenHere[r.key] && !r.ownerId ? { ...r, ownerId: uid, ownerName: null } : r));
  });
  let counts = $derived(pipelineCounts(rows));

  const STAGES = STAGE_FILTERS as readonly string[];
  let filter = $derived({
    stage: (STAGES.includes(page.url.searchParams.get('s') ?? '') ? page.url.searchParams.get('s') : 'open') as StageFilter,
    owner: (['me', 'none'].includes(page.url.searchParams.get('who') ?? '') ? page.url.searchParams.get('who') : 'all') as OwnerFilter,
    source: page.url.searchParams.get('src') ?? DEFAULT_PIPELINE_FILTER.source,
    attention: page.url.searchParams.get('attention') === '1'
  });
  let list = $derived(filterPipeline(rows, filter, uid));
  let sources = $derived([...new Set(rows.map((r) => r.source))].sort());

  function setParam(key: string, value: string | null) {
    const url = new URL(page.url);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function clearFilters() {
    const url = new URL(page.url);
    for (const k of ['s', 'who', 'src', 'attention']) url.searchParams.delete(k);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  const when = (iso: string | null) => formatWhen(iso, clock.minutes, $locale || 'he');

  function hrefOf(r: PipelineRow): string {
    if (r.kind === 'lead') return `${base}/leads/${r.id}`;
    if (r.kind === 'order') return `${base}/orders/${r.id}`;
    return `/moach/${projectId}/wishes`;
  }

  function sourceText(r: PipelineRow): string {
    return r.sourceLabel ?? $t(`shop.leads.source.${r.source}`);
  }

  function stageText(r: PipelineRow): string {
    return $t(`shop.leads.stage.${r.stage}`);
  }

  // ── row actions ──
  let busyKey = $state<string | null>(null);
  async function take(r: PipelineRow) {
    if (!r.actId || !uid || busyKey) return;
    busyKey = r.key;
    try {
      // Taking the lead is taking its task: the sync makes the taker its owner.
      const res = await executeAction(
        'updateTask',
        { id: r.actId, projectId, uid: [uid], isAssigned: true, myIshur: true },
        { showErrorToast: false }
      );
      if (!res.success) {
        toast.error(actionErrorText(res, $t('shop.leads.err.save')));
        return;
      }
      takenHere = { ...takenHere, [r.key]: true };
      toast.success($t('shop.leads.taken'));
    } finally {
      busyKey = null;
    }
  }

  let sheet = $state<'new' | 'log' | 'pause' | null>(null);
  let sheetOpen = $state(false);
  let target = $state<PipelineRow | null>(null);
  function open(kind: 'new' | 'log' | 'pause', r: PipelineRow | null = null) {
    sheet = kind;
    target = r;
    sheetOpen = true;
  }
  function done() {
    sheetOpen = false;
    invalidate(shopOrdersKey(projectId));
  }
</script>

<div class="pl-head">
  <p class="pl-count">
    {#if loaded && pipeline?.ready}{$t('shop.leads.list.count', { count: counts.open })}{/if}
  </p>
  <button type="button" class="sh-btn sh-btn-primary" onclick={() => open('new')} disabled={!pipeline?.ready}>
    + {$t('shop.leads.new.cta')}
  </button>
</div>

{#if !loaded}
  <p class="pl-wait">{$t('shop.leads.list.loading')}</p>
{:else if !pipeline?.ready}
  <ShopNotice title={$t('shop.leads.err.notReady')} body={$t('shop.leads.err.notReadyBody')} />
{:else if rows.length === 0}
  <ShopNotice
    title={$t('shop.leads.empty.title')}
    body={$t('shop.leads.empty.body')}
    action={{ label: $t('shop.leads.empty.cta'), href: `${base}/connect` }}
  />
{:else}
  <div class="pl-tools">
    <div class="sh-pills" role="group" aria-label={$t('shop.leads.list.stageLabel')}>
      {#each STAGE_FILTERS as s (s)}
        <button type="button" class="sh-pill" aria-pressed={filter.stage === s} onclick={() => setParam('s', s === 'open' ? null : s)}>
          {$t(`shop.leads.filter.${s}`)}
          {#if s === 'paused' && counts.paused > 0}<span class="sh-pill-count">{counts.paused}</span>{/if}
        </button>
      {/each}
    </div>
    <div class="pl-selects">
      <button
        type="button"
        class="sh-pill"
        class:pl-warn={counts.attention > 0}
        aria-pressed={filter.attention}
        onclick={() => setParam('attention', filter.attention ? null : '1')}
      >
        {$t('shop.leads.filter.attention')}
        {#if counts.attention > 0}<span class="sh-pill-count">{counts.attention}</span>{/if}
      </button>
      <label class="pl-select">
        <span class="sr-only">{$t('shop.leads.list.ownerLabel')}</span>
        <select class="sh-input" value={filter.owner} onchange={(e) => setParam('who', e.currentTarget.value === 'all' ? null : e.currentTarget.value)}>
          <option value="all">{$t('shop.leads.owner.all')}</option>
          <option value="me">{$t('shop.leads.owner.me')}</option>
          <option value="none">{$t('shop.leads.owner.none')}</option>
        </select>
      </label>
      {#if sources.length > 1}
        <label class="pl-select">
          <span class="sr-only">{$t('shop.leads.list.sourceLabel')}</span>
          <select class="sh-input" value={filter.source} onchange={(e) => setParam('src', e.currentTarget.value === 'all' ? null : e.currentTarget.value)}>
            <option value="all">{$t('shop.leads.source.all')}</option>
            {#each sources as s (s)}<option value={s}>{$t(`shop.leads.source.${s}`)}</option>{/each}
          </select>
        </label>
      {/if}
    </div>
  </div>

  {#if list.length === 0}
    <ShopNotice title={$t('shop.empty.filtered')} action={{ label: $t('shop.empty.clearFilter'), onclick: clearFilters }} />
  {:else}
    {#snippet attentionTag(r: PipelineRow)}
      {#if r.attention}<span class="sh-chip sh-chip-warn">{$t(`shop.leads.attention.${r.attention}`)}</span>{/if}
    {/snippet}
    {#snippet actions(r: PipelineRow, outline: boolean)}
      {#if r.kind === 'lead'}
        {#if !r.ownerId && r.actId && uid}
          <button type="button" class="sh-btn {outline ? 'sh-btn-outline' : 'sh-btn-primary'} pl-quick" disabled={busyKey === r.key} onclick={() => take(r)}>
            {$t('shop.leads.action.take')}
          </button>
        {/if}
        <button type="button" class="sh-btn sh-btn-outline pl-quick" onclick={() => open('log', r)}>{$t('shop.leads.action.log')}</button>
        {#if r.stage !== 'paused' && r.stage !== 'offered'}
          <button type="button" class="sh-btn sh-btn-quiet pl-quick" onclick={() => open('pause', r)}>{$t('shop.leads.action.pause')}</button>
        {/if}
      {:else}
        <a class="sh-btn sh-btn-outline pl-quick" href={hrefOf(r)}>{r.kind === 'order' ? $t('shop.leads.action.openOrder') : $t('shop.leads.action.openWish')}</a>
      {/if}
    {/snippet}

    <!-- phone: cards -->
    <ul class="pl-cards">
      {#each list as r (r.key)}
        <li class="pl-card" class:pl-card-warn={!!r.attention}>
          <a class="pl-card-top" href={hrefOf(r)}>
            <span class="pl-name">{r.name}{#if r.organization}<span class="pl-org"> · {r.organization}</span>{/if}</span>
            {#if r.amount}<span class="pl-sum sh-num"><bdi>{fmtMoney(r.amount, r.currency)}</bdi></span>{/if}
          </a>
          <div class="pl-tags">
            <span class="sh-chip {STAGE_CHIP[r.stage]}">{stageText(r)}</span>
            {@render attentionTag(r)}
            <span class="pl-muted">{sourceText(r)}</span>
            <time class="pl-muted" datetime={when(r.lastAt)?.iso} title={when(r.lastAt)?.full}>{when(r.lastAt)?.short}</time>
          </div>
          {#if r.nextAction || r.followUpAt}
            <p class="pl-next">
              {#if r.nextAction}{r.nextAction}{/if}
              {#if r.followUpAt}<span class="pl-muted"> · {$t('shop.leads.list.backOn', { when: when(r.followUpAt)?.short ?? '' })}</span>{/if}
            </p>
          {/if}
          <div class="pl-card-foot">{@render actions(r, false)}</div>
        </li>
      {/each}
    </ul>

    <!-- desktop: the table -->
    <div class="sh-table-wrap pl-table">
      <table class="sh-table">
        <thead>
          <tr>
            <th scope="col">{$t('shop.leads.col.name')}</th>
            <th scope="col">{$t('shop.leads.col.source')}</th>
            <th scope="col">{$t('shop.leads.col.product')}</th>
            <th scope="col">{$t('shop.leads.col.stage')}</th>
            <th scope="col">{$t('shop.leads.col.owner')}</th>
            <th scope="col">{$t('shop.leads.col.last')}</th>
            <th scope="col">{$t('shop.leads.col.next')}</th>
            <th scope="col"><span class="sr-only">{$t('shop.leads.col.action')}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each list as r (r.key)}
            <tr>
              <td>
                <a class="pl-name-link" href={hrefOf(r)}>{r.name}</a>
                {#if r.organization}<div class="pl-muted">{r.organization}</div>{/if}
                {#if r.kind === 'order'}<div class="pl-muted">{$t('shop.order.number', { number: '' })}<bdi>{r.number}</bdi></div>{/if}
              </td>
              <td class="pl-muted">{sourceText(r)}</td>
              <td class="pl-muted">{r.products.join(', ') || '—'}</td>
              <td>
                <span class="pl-tag-col">
                  <span class="sh-chip {STAGE_CHIP[r.stage]}">{stageText(r)}</span>
                  {@render attentionTag(r)}
                </span>
              </td>
              <td class="pl-muted">
                {#if r.kind !== 'lead'}—{:else if r.ownerId && r.ownerId === uid}{$t('shop.leads.owner.you')}{:else}{r.ownerName ?? $t('shop.leads.owner.nobody')}{/if}
              </td>
              <td class="pl-muted"><time datetime={when(r.lastAt)?.iso} title={when(r.lastAt)?.full}>{when(r.lastAt)?.short}</time></td>
              <td class="pl-next-cell">
                {#if r.nextAction}<div>{r.nextAction}</div>{/if}
                {#if r.followUpAt}<div class="pl-muted">{$t('shop.leads.list.backOn', { when: when(r.followUpAt)?.short ?? '' })}</div>{/if}
                {#if r.kind === 'order' && r.amount}<div class="sh-num"><bdi>{fmtMoney(r.amount, r.currency)}</bdi></div>{/if}
              </td>
              <td class="pl-act">{@render actions(r, true)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}

<ShopSheet bind:open={sheetOpen} label={sheet === 'new' ? $t('shop.leads.new.title') : sheet === 'pause' ? $t('shop.leads.pause.title') : $t('shop.leads.action.log')}>
  {#if sheet === 'new'}
    <NewLeadForm {projectId} onDone={(id) => { sheetOpen = false; goto(`${base}/leads/${id}`); }} />
  {:else if sheet === 'log' && target}
    <h2 class="sh-title pl-sheet-title">{$t('shop.leads.log.title', { name: target.name })}</h2>
    <LeadLogForm {projectId} leadId={target.id} onDone={done} />
  {:else if sheet === 'pause' && target}
    <LeadPauseForm {projectId} leadId={target.id} onDone={done} />
  {/if}
</ShopSheet>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .pl-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .pl-count {
    margin: 0;
    font-size: 14px;
    color: var(--sh-muted);
  }
  .pl-wait {
    text-align: center;
    color: var(--sh-muted);
    padding: 32px 0;
  }
  .pl-tools {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }
  .pl-selects {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .pl-select select {
    min-height: 38px;
  }
  .pl-warn {
    border-color: var(--sh-warn-line);
  }
  .pl-cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pl-card {
    background: var(--sh-card);
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pl-card-warn {
    border-color: var(--sh-warn-line);
  }
  .pl-card-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    color: var(--sh-ink) !important;
  }
  .pl-name {
    font-size: 16px;
    font-weight: 700;
    min-width: 0;
  }
  .pl-org {
    font-weight: 400;
    color: var(--sh-muted);
  }
  .pl-sum {
    font-weight: 700;
    color: var(--sh-gold);
  }
  .pl-tags,
  .pl-tag-col {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
  }
  .pl-muted {
    font-size: 13px;
    color: var(--sh-muted);
  }
  .pl-next {
    margin: 0;
    font-size: 14px;
    color: var(--sh-ink);
  }
  .pl-card-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pl-quick {
    min-height: 40px;
    padding: 0 14px;
  }
  .pl-table {
    display: none;
  }
  .pl-name-link {
    font-weight: 700;
    color: var(--sh-ink) !important;
  }
  .pl-next-cell {
    font-size: 13px;
    max-width: 220px;
  }
  .pl-act {
    text-align: end;
    white-space: nowrap;
  }
  .pl-act :global(.sh-btn + .sh-btn) {
    margin-inline-start: 6px;
  }
  .pl-sheet-title {
    font-size: 22px;
    margin: 0 0 12px;
  }
  @media (min-width: 900px) {
    .pl-tools {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .pl-cards {
      display: none;
    }
    .pl-table {
      display: block;
    }
  }
</style>
