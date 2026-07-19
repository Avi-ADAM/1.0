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
  import { chainsForPartof, findChainByRef } from '$lib/utils/processLifecycle';
  import ProcessLifecycle from '$lib/components/process/lifecycle/ProcessLifecycle.svelte';
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

  // Resolution: direct chain / entity ref first, partof-based process second.
  let direct = $derived(findChainByRef(missionChains, resourceChains, processId));
  let partofMatches = $derived(
    direct || !attrs ? null : chainsForPartof(missionChains, resourceChains, processId)
  );

  let matched = $derived(
    direct
      ? [{ chain: direct.chain, kind: direct.kind }]
      : partofMatches
        ? [
            ...partofMatches.missionChains.map((chain) => ({ chain, kind: 'mission' })),
            ...partofMatches.resourceChains.map((chain) => ({ chain, kind: 'resource' }))
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
          <span class="ppd-icon" aria-hidden="true">{entry.kind === 'mission' ? '◆' : '◇'}</span>
          <h1 class="ppd-title">{chainName(entry)}</h1>
          <span class="ppd-type">{entry.kind === 'mission' ? t.missionChain : t.resourceChain}</span>
        </header>
        <div class="ppd-card">
          <ProcessLifecycle kind={entry.kind} chain={entry.chain} {projectId} lang={$lang} />
        </div>
      </article>
    {/each}
  {/if}
</div>

<style>
  /* Same design-token cascade as ProcessChainView / the chain detail page, so
     the lifecycle components inherit identical light/dark palettes. */
  .ppd {
    --gold:   #d97706;
    --gold-h: #f59e0b;
    --rose:   #be123c;

    --pcv-bg:           #fffbf0;
    --pcv-card:         #ffffff;
    --pcv-card-hover:   #fef9ec;
    --pcv-node-bg:      #ffffff;
    --pcv-node-hover:   #fffbf0;
    --pcv-node-border:  #e7e5e4;
    --pcv-border:       #f3e8c8;
    --pcv-text:         #1c1917;
    --pcv-text-2:       #78716c;
    --pcv-text-3:       #a8a29e;

    --badge-gold-bg:    rgba(217,119,  6, .10);
    --badge-gold-text:  #b45309;
    --badge-rose-bg:    rgba(225, 29, 72, .10);
    --badge-rose-text:  #be123c;
    --badge-green-bg:   rgba(  5,150,105, .10);
    --badge-green-text: #065f46;
    --badge-sky-bg:     rgba(  2,132,199, .10);
    --badge-sky-text:   #0369a1;
    --badge-grey-bg:    rgba(107,114,128, .10);
    --badge-grey-text:  #6b7280;

    min-height: 60vh;
    background: var(--pcv-bg);
    border-radius: 16px;
    padding: 1rem 1rem 2rem;
    text-align: start;
  }

  @media (prefers-color-scheme: dark) {
    .ppd {
      --gold:   #fbbf24;
      --gold-h: #f59e0b;
      --rose:   #fb7185;

      --pcv-bg:           #09090b;
      --pcv-card:         #18181b;
      --pcv-card-hover:   #1f1f23;
      --pcv-node-bg:      #18181b;
      --pcv-node-hover:   #27272a;
      --pcv-node-border:  #3f3f46;
      --pcv-border:       #27272a;
      --pcv-text:         #fafaf9;
      --pcv-text-2:       #a8a29e;
      --pcv-text-3:       #52525b;

      --badge-gold-bg:    rgba(251,191, 36, .14);
      --badge-gold-text:  #fbbf24;
      --badge-rose-bg:    rgba(251,113,133, .14);
      --badge-rose-text:  #fb7185;
      --badge-green-bg:   rgba( 52,211,153, .12);
      --badge-green-text: #34d399;
      --badge-sky-bg:     rgba( 56,189,248, .12);
      --badge-sky-text:   #38bdf8;
      --badge-grey-bg:    rgba(113,113,122, .12);
      --badge-grey-text:  #71717a;
    }
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
    color: var(--pcv-text);
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
    box-shadow: 0 0 0 1px rgba(245,158,11,.08), 0 4px 20px rgba(245,158,11,.06);
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
