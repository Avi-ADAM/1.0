<script>
  /**
   * Detailed process page — the full life of one mission or resource chain:
   * initial decision + votes/negotiation + chat, the open offer and its join
   * requests, execution (tasks, timers by month), finish approvals and the
   * official archive. Reached from the processes board, from a chain row's
   * "open process page" link, or from any object page's "full process" link.
   *
   * The [processId] param accepts:
   *  · a chain id (`pendm-N` / `om-N` / `bm-N`, or a numeric open_mashaabim id)
   *  · an entity ref (`ask-N`, `act-N`, `fini-N`, `fm-N`, `pmash-N`, `askm-N`,
   *    `maap-N`, `rikmash-N`, `mash-N`) — resolves to the chain containing it
   *  · a partof-based process id from the processes tab — shows every chain
   *    belonging to that process.
   */
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { reconstructMissionChains, reconstructResourceChains } from '$lib/utils/reconstructChains.js';
  import { chainsForPartof, findChainByRef, reconstructSaleChains } from '$lib/utils/processLifecycle';
  import ProcessLifecycle from '$lib/components/process/lifecycle/ProcessLifecycle.svelte';
  import SaleLifecycle from '$lib/components/process/lifecycle/SaleLifecycle.svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let processId = $derived(page.params.processId);

  let loading = $state(true);
  let loadError = $state(null);
  let attrs = $state(null);

  onMount(async () => {
    try {
      const json = await sendToSer({ pid: projectId }, 'processLifecycleData', null, null, false, fetch);
      attrs = json?.data?.project?.data?.attributes ?? null;
      if (!attrs) loadError = 'no_data';
    } catch (e) {
      loadError = e?.message ?? 'fetch_error';
    } finally {
      loading = false;
    }
  });

  let missionChains = $derived(
    attrs
      ? reconstructMissionChains(
          attrs.pendms?.data ?? [],
          attrs.open_missions?.data ?? [],
          attrs.mesimabetahaliches?.data ?? [],
          attrs.finnished_missions?.data ?? [],
          attrs.acts?.data ?? []
        )
      : []
  );
  let resourceChains = $derived(
    attrs ? reconstructResourceChains(attrs.open_mashaabims?.data ?? [], []) : []
  );
  let saleChains = $derived(
    attrs ? reconstructSaleChains(attrs.matanotofs?.data ?? [], attrs.sales?.data ?? []) : []
  );

  // Resolution: direct chain / entity ref first, partof-based process second.
  let direct = $derived(findChainByRef(missionChains, resourceChains, processId, saleChains));
  let partofMatches = $derived(
    direct || !attrs ? null : chainsForPartof(missionChains, resourceChains, processId, saleChains)
  );

  let matched = $derived(
    direct
      ? [{ chain: direct.chain, kind: direct.kind }]
      : partofMatches
        ? [
            ...partofMatches.missionChains.map((chain) => ({ chain, kind: 'mission' })),
            ...partofMatches.resourceChains.map((chain) => ({ chain, kind: 'resource' })),
            ...partofMatches.saleChains.map((chain) => ({ chain, kind: 'sale' }))
          ]
        : []
  );

  function chainName(entry) {
    const chain = entry.chain;
    return (
      chain?.pendm?.attributes?.name ??
      chain?.openMission?.attributes?.name ??
      chain?.mesimabetahalich?.attributes?.name ??
      chain?.pmash?.attributes?.name ??
      chain?.openMashaabim?.attributes?.name ??
      chain?.matanot?.attributes?.name ??
      `#${chain?.id ?? processId}`
    );
  }

  const i18n = {
    he: {
      title: 'עמוד תהליך מפורט',
      back: 'לכל התהליכים',
      chains: 'לשרשראות',
      notFound: 'תהליך לא נמצא',
      notFoundSub: 'לא נמצאה שרשרת או תהליך המתאימים למזהה המבוקש בפרויקט זה.',
      missionChain: 'תהליך משימה',
      resourceChain: 'תהליך משאב',
      saleChain: 'תהליך מכירה',
      loading: 'טוען תהליך…',
      error: 'שגיאה בטעינת הנתונים'
    },
    en: {
      title: 'Detailed process page',
      back: 'All processes',
      chains: 'Chains',
      notFound: 'Process not found',
      notFoundSub: 'No chain or process matches the requested id in this project.',
      missionChain: 'Mission process',
      resourceChain: 'Resource process',
      saleChain: 'Sale process',
      loading: 'Loading process…',
      error: 'Failed to load data'
    },
    ar: {
      title: 'صفحة عملية مفصلة',
      back: 'كل العمليات',
      chains: 'السلاسل',
      notFound: 'العملية غير موجودة',
      notFoundSub: 'لا توجد سلسلة أو عملية تطابق المعرف المطلوب في هذا المشروع.',
      missionChain: 'عملية مهمة',
      resourceChain: 'عملية مورد',
      saleChain: 'عملية بيع',
      loading: 'جارٍ التحميل…',
      error: 'فشل تحميل البيانات'
    }
  };
  let t = $derived(i18n[$lang] ?? i18n.en);
</script>

<svelte:head>
  <title>
    {matched.length === 1 ? `${chainName(matched[0])} · ` : ''}{t.title} · 1lev1
  </title>
</svelte:head>

<div class="ppd" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="ppd-nav">
    <button type="button" class="ppd-back" onclick={() => goto(`/moach/${projectId}/processes`)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#if $isRtl}<polyline points="9 18 15 12 9 6" />{:else}<polyline points="15 18 9 12 15 6" />{/if}
      </svg>
      {t.back}
    </button>
    <button type="button" class="ppd-back" onclick={() => goto(`/moach/${projectId}/chains`)}>
      {t.chains}
    </button>
  </div>

  {#if loading}
    <div class="ppd-state"><Lowding /><p class="ppd-state-sub">{t.loading}</p></div>
  {:else if loadError}
    <div class="ppd-state">
      <p class="ppd-state-title">{t.error}</p>
      <code class="ppd-id">{loadError}</code>
    </div>
  {:else if matched.length === 0}
    <div class="ppd-state">
      <span class="ppd-state-icon" aria-hidden="true">◈</span>
      <p class="ppd-state-title">{t.notFound}</p>
      <p class="ppd-state-sub">{t.notFoundSub}</p>
      <code class="ppd-id">{processId}</code>
    </div>
  {:else}
    {#each matched as entry (entry.chain.id)}
      <article class="ppd-chain">
        <header class="ppd-header">
          <span class="ppd-icon" aria-hidden="true">
            {entry.kind === 'mission' ? '◆' : entry.kind === 'sale' ? '✦' : '◇'}
          </span>
          <h1 class="ppd-title">{chainName(entry)}</h1>
          <span class="ppd-type">
            {entry.kind === 'mission'
              ? t.missionChain
              : entry.kind === 'sale'
                ? t.saleChain
                : t.resourceChain}
          </span>
        </header>
        <div class="ppd-card">
          {#if entry.kind === 'sale'}
            <SaleLifecycle chain={entry.chain} {projectId} lang={$lang} />
          {:else}
            <ProcessLifecycle kind={entry.kind} chain={entry.chain} {projectId} lang={$lang} />
          {/if}
        </div>
      </article>
    {/each}
  {/if}
</div>

<style>
  /* Design-token cascade for the lifecycle components — tuned to the moach
     look: the layout's dark slate gradient shows through, cards are
     translucent slate, and the accents are the site gold (--gold #eee8aa)
     with barbi-pink for "active now". Always dark — the moach shell is dark
     regardless of the OS color scheme. */
  .ppd {
    --gold:   #eee8aa;
    --gold-h: #ffd700;
    --rose:   var(--barbi-pink, #ff0092);

    --pcv-bg:           transparent;
    --pcv-card:         rgba(15, 23, 42, 0.72);
    --pcv-card-hover:   rgba(30, 41, 59, 0.8);
    --pcv-node-bg:      rgba(30, 41, 59, 0.55);
    --pcv-node-hover:   rgba(51, 65, 85, 0.6);
    --pcv-node-border:  rgba(148, 163, 184, 0.28);
    --pcv-border:       rgba(148, 163, 184, 0.32);
    --pcv-text:         #f1f5f9;
    --pcv-text-2:       #cbd5e1;
    --pcv-text-3:       #94a3b8;

    --badge-gold-bg:    rgba(238, 232, 170, 0.14);
    --badge-gold-text:  #eee8aa;
    --badge-rose-bg:    rgba(255,   0, 146, 0.16);
    --badge-rose-text:  #ff9ad5;
    --badge-green-bg:   rgba( 46, 255, 168, 0.12);
    --badge-green-text: #2effa8;
    --badge-sky-bg:     rgba( 34, 211, 238, 0.12);
    --badge-sky-text:   #67e8f9;
    --badge-grey-bg:    rgba(148, 163, 184, 0.14);
    --badge-grey-text:  #94a3b8;

    min-height: 60vh;
    background: var(--pcv-bg);
    padding: 0.25rem 0.25rem 2rem;
    text-align: start;
  }

  .ppd-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .ppd-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text-2);
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .ppd-back:hover {
    border-color: var(--gold);
    color: var(--badge-gold-text);
    background: var(--badge-gold-bg);
  }
  .ppd-back svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ppd-chain { margin-bottom: 1.5rem; }

  .ppd-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  .ppd-icon { font-size: 1.1rem; color: var(--gold); line-height: 1; }

  .ppd-title {
    margin: 0;
    font-size: clamp(1.05rem, 3vw, 1.4rem);
    font-weight: 700;
    color: var(--gold);
    word-break: break-word;
  }

  .ppd-type {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: var(--badge-gold-bg);
    color: var(--badge-gold-text);
  }

  .ppd-card {
    border-radius: 14px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    overflow: hidden;
    backdrop-filter: blur(6px);
    box-shadow: 0 0 0 1px rgba(238,232,170,.10), 0 4px 24px rgba(0,0,0,.35);
  }

  .ppd-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
    text-align: center;
    gap: 10px;
  }

  .ppd-state-icon { font-size: 2rem; color: var(--badge-gold-text); opacity: 0.4; }
  .ppd-state-title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--pcv-text); }
  .ppd-state-sub { margin: 0; font-size: 0.8125rem; color: var(--pcv-text-2); }

  .ppd-id {
    font-size: 11px;
    font-family: ui-monospace, monospace;
    color: var(--pcv-text-3);
    background: var(--badge-grey-bg);
    padding: 2px 8px;
    border-radius: 6px;
  }
</style>
