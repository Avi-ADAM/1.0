<script>
  import { isRtl } from '$lib/translations';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { idPr } from '$lib/stores/idPr.js';
  import { lang } from '$lib/stores/lang.js';
  import { reconstructMissionChains, reconstructResourceChains } from '$lib/utils/reconstructChains.js';
  import MissionChainRow from '$lib/components/process/chain/MissionChainRow.svelte';
  import ResourceChainRow from '$lib/components/process/chain/ResourceChainRow.svelte';
  import { toast } from 'svelte-sonner';
  import { sendToSer } from '$lib/send/sendToSer.js';

  // ---------------------------------------------------------------------------
  // Route param
  // ---------------------------------------------------------------------------
  let projectId = $derived(page.params.projectId);
  let processId = $derived(page.params.chainId);

  // ---------------------------------------------------------------------------
  // i18n
  // ---------------------------------------------------------------------------
  const i18n = {
    he: {
      back:        'חזרה לפרויקט',
      loading:     'טוען תהליך…',
      notFound:    'תהליך לא נמצא',
      notFoundSub: 'לא ניתן למצוא את התהליך המבוקש בפרויקט זה.',
      noProject:   'לא נבחר פרויקט',
      noProjectSub:'יש לחזור ולבחור פרויקט תחילה.',
      missionChain: 'שרשרת משימות',
      resourceChain:'שרשרת משאבים',
      processPage: 'עמוד תהליך',
      id:          'מזהה',
      chatSoon:    'דיון בתהליך — בקרוב',
      chatDesc:    'כאן יתאפשר לנהל דיון ואינטגרציה של צ׳אטים ישירות בתוך התהליך.'
    },
    en: {
      back:        'Back to project',
      loading:     'Loading process…',
      notFound:    'Process not found',
      notFoundSub: 'Could not find the requested process in this project.',
      noProject:   'No project selected',
      noProjectSub:'Please go back and select a project first.',
      missionChain: 'Mission Chain',
      resourceChain:'Resource Chain',
      processPage: 'Process Page',
      id:          'ID',
      chatSoon:    'Process discussion — coming soon',
      chatDesc:    'Discussion threads and chat integration will appear here.'
    },
    ar: {
      back:        'العودة إلى المشروع',
      loading:     'جارٍ التحميل…',
      notFound:    'العملية غير موجودة',
      notFoundSub: 'تعذر العثور على العملية المطلوبة في هذا المشروع.',
      noProject:   'لم يتم اختيار مشروع',
      noProjectSub:'يرجى العودة واختيار مشروع أولاً.',
      missionChain: 'سلسلة المهام',
      resourceChain:'سلسلة الموارد',
      processPage: 'صفحة العملية',
      id:          'معرف',
      chatSoon:    'مناقشة العملية — قريبًا',
      chatDesc:    'ستظهر هنا سلاسل النقاش وتكامل الدردشة.'
    }
  };

  let t = $derived(i18n[$lang] ?? i18n.en);

  // ---------------------------------------------------------------------------
  // Data state
  // ---------------------------------------------------------------------------
  let loading    = $state(true);
  let loadError  = $state(null);

  let pmiData    = $state([]);
  let omiData    = $state([]);
  let bmiData    = $state([]);
  let fmiData    = $state([]);
  let opmash     = $state([]);
  let rikmashes  = $state([]);
  let acts       = $state([]);

  let loadedItems = $state(new Map());
  let loadingIds  = $state(new Set());

  // ---------------------------------------------------------------------------
  // Chain reconstruction + lookup
  // ---------------------------------------------------------------------------
  let missionChains  = $derived(reconstructMissionChains(pmiData, omiData, bmiData, fmiData, acts));
  let resourceChains = $derived(reconstructResourceChains(opmash, rikmashes));

  let chain = $derived(
    missionChains.find((c) => c.id === processId) ??
    resourceChains.find((c) => c.id === processId) ??
    null
  );

  let isMissionChain  = $derived(chain != null && missionChains.some((c) => c.id === processId));
  let isResourceChain = $derived(chain != null && resourceChains.some((c) => c.id === processId));

  let chainName = $derived(
    chain?.pendm?.attributes?.name ??
    chain?.openMission?.attributes?.name ??
    chain?.mesimabetahalich?.attributes?.name ??
    chain?.pmash?.attributes?.name ??
    chain?.openMashaabim?.attributes?.name ??
    processId
  );

  // ---------------------------------------------------------------------------
  // Lazy-load finnished_missions
  // ---------------------------------------------------------------------------
  async function handleLazyLoad(id) {
    if (loadingIds.has(id)) return;
    loadingIds = new Set([...loadingIds, id]);
    try {
      const result = await sendToSer({ id }, 'getFinnishedMission', null, null, false, fetch);
      const entity = result?.finnishedMission?.data ?? result?.data?.finnishedMission?.data ?? null;
      const next   = new Map(loadedItems);
      next.set(id, entity);
      loadedItems = next;
    } catch {
      toast.error($lang === 'he' ? 'שגיאה בטעינת המשימה שהסתיימה' : 'Failed to load completed mission');
    } finally {
      const next = new Set(loadingIds);
      next.delete(id);
      loadingIds = next;
    }
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  $effect(() => {
    if (!projectId) {
      loading = false;
      return;
    }
    loadProjectData(projectId);
  });

  async function loadProjectData(projectId) {
    loading   = true;
    loadError = null;

    try {
      // Routed through the secure proxy (qid) so the JWT stays in the HttpOnly
      // cookie. `withLoc` mirrors the original he-only localization fragment.
      const json = await sendToSer(
        { pid: projectId, withLoc: $lang === 'he' },
        'chainDetailProjectData',
        0,
        0,
        false,
        fetch
      );
      const attrs = json?.data?.project?.data?.attributes;
      if (!attrs) { loadError = 'no_data'; loading = false; return; }

      acts      = attrs.acts?.data ?? [];
      bmiData   = attrs.mesimabetahaliches?.data ?? [];
      omiData   = attrs.open_missions?.data ?? [];
      pmiData   = attrs.pendms?.data ?? [];
      fmiData   = attrs.finnished_missions?.data ?? [];
      opmash    = attrs.open_mashaabims?.data ?? [];
      rikmashes = attrs.rikmashes?.data ?? [];

    } catch (e) {
      loadError = e?.message ?? 'fetch_error';
      toast.error($lang === 'he' ? 'שגיאה בטעינת הנתונים' : 'Failed to load project data');
    } finally {
      loading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Modal / chat handlers (no-op on this page — kept for prop compatibility)
  // ---------------------------------------------------------------------------
  function handleOpenModal({ id, kind }) {
    toast.info(`${kind} #${id}`);
  }
  function handleOpenActModal(act) {
    toast.info(`Act: ${act?.attributes?.shem ?? act?.id}`);
  }
  function handleOpenChat({ id }) {
    toast.info(`Chat #${id}`);
  }
</script>

<svelte:head>
  <title>{chainName} — {t.processPage}</title>
</svelte:head>

<div class="pp" dir={$isRtl ? 'rtl' : 'ltr'}>

  <!-- ── Back navigation ──────────────────────────────────────────────────── -->
  <div class="pp-nav">
    <button type="button" class="pp-back" onclick={() => goto(`/moach/${projectId}/chains`)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#if $lang === 'he'}
          <polyline points="9 18 15 12 9 6" />
        {:else}
          <polyline points="15 18 9 12 15 6" />
        {/if}
      </svg>
      {t.back}
    </button>
  </div>

  <!-- ── No project selected ──────────────────────────────────────────────── -->
  {#if !$idPr || $idPr === 0}
    <div class="pp-state">
      <span class="pp-state-icon" aria-hidden="true">◈</span>
      <p class="pp-state-title">{t.noProject}</p>
      <p class="pp-state-sub">{t.noProjectSub}</p>
      <button type="button" class="pp-cta" onclick={() => goto('/')}>
        {t.back}
      </button>
    </div>

  <!-- ── Loading ──────────────────────────────────────────────────────────── -->
  {:else if loading}
    <div class="pp-state">
      <div class="pp-spinner" aria-label={t.loading}>
        <svg viewBox="0 0 24 24" class="pp-spin-svg" aria-hidden="true">
          <circle class="pp-spin-track" cx="12" cy="12" r="10" />
          <path class="pp-spin-arc" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
      <p class="pp-state-sub">{t.loading}</p>
    </div>

  <!-- ── Chain not found ──────────────────────────────────────────────────── -->
  {:else if !chain}
    <div class="pp-state">
      <span class="pp-state-icon" aria-hidden="true">◇</span>
      <p class="pp-state-title">{t.notFound}</p>
      <p class="pp-state-sub">{t.notFoundSub}</p>
      <code class="pp-id-pill">{processId}</code>
      <button type="button" class="pp-cta" onclick={() => goto(`/moach/${projectId}/chains`)}>
        {t.back}
      </button>
    </div>

  <!-- ── Chain detail ─────────────────────────────────────────────────────── -->
  {:else}
    <!-- Header -->
    <header class="pp-header">
      <div class="pp-header-inner">
        <div class="pp-title-row">
          <span class="pp-chain-icon" aria-hidden="true">
            {isMissionChain ? '◆' : '◇'}
          </span>
          <h1 class="pp-title">{chainName}</h1>
        </div>

        <div class="pp-meta">
          <span class="pp-type-badge">
            {isMissionChain ? t.missionChain : t.resourceChain}
          </span>
          <span class="pp-id-pill">{t.id}: {processId}</span>
        </div>
      </div>
    </header>

    <!-- Chain nodes (always shown expanded on this page) -->
    <section class="pp-chain-section">
      <div class="pp-chain-card">
        {#if isMissionChain}
          <MissionChainRow
            {chain}
            {loadedItems}
            {loadingIds}
            onOpenModal={handleOpenModal}
            onOpenActModal={handleOpenActModal}
            onOpenChat={handleOpenChat}
            onLazyLoad={handleLazyLoad}
            isExpanded={true}
            onToggle={() => {}}
            lang={$lang}
          />
        {:else if isResourceChain}
          <ResourceChainRow
            {chain}
            onOpenModal={handleOpenModal}
            isExpanded={true}
            onToggle={() => {}}
            lang={$lang}
          />
        {/if}
      </div>
    </section>

    <!-- Discussion / chat placeholder -->
    <section class="pp-chat-section" aria-labelledby="chat-heading">
      <div class="pp-chat-card">
        <div class="pp-chat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h2 id="chat-heading" class="pp-chat-title">{t.chatSoon}</h2>
          <p class="pp-chat-desc">{t.chatDesc}</p>
        </div>
      </div>
    </section>

  {/if}
</div>

<style>
  /* ══════════════════════════════════════════════════════════════════════════
     Design-token root — mirrors ProcessChainView so child components get
     the same CSS variable cascade.
     ══════════════════════════════════════════════════════════════════════════ */
  .pp {
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

    min-height: 100vh;
    background: var(--pcv-bg);
    padding: 0 0 3rem;
  }

  @media (prefers-color-scheme: dark) {
    .pp {
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

  /* ── Layout wrapper ────────────────────────────────────────────────────── */
  .pp-nav,
  .pp-header,
  .pp-chain-section,
  .pp-chat-section {
    max-width: 56rem;
    margin: 0 auto;
    padding-inline: 1rem;
  }

  /* ── Back button ───────────────────────────────────────────────────────── */
  .pp-nav {
    padding-top: 1rem;
    padding-bottom: 0.25rem;
  }

  .pp-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px 5px 8px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text-2);
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }

  .pp-back:hover {
    border-color: var(--gold);
    color: var(--badge-gold-text);
    background: var(--badge-gold-bg);
  }

  .pp-back svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }

  /* ── Page header ───────────────────────────────────────────────────────── */
  .pp-header {
    padding-top: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--pcv-border);
    margin-bottom: 1.25rem;
  }

  .pp-header-inner { display: flex; flex-direction: column; gap: 8px; }

  .pp-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pp-chain-icon {
    font-size: 1.25rem;
    color: var(--gold);
    line-height: 1;
    flex-shrink: 0;
  }

  .pp-title {
    font-size: clamp(1.1rem, 3vw, 1.5rem);
    font-weight: 700;
    color: var(--pcv-text);
    line-height: 1.2;
    margin: 0;
    word-break: break-word;
  }

  .pp-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-inline-start: 2rem;
  }

  .pp-type-badge {
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
    border: 1px solid var(--badge-gold-bg);
  }

  .pp-id-pill {
    font-size: 11px;
    font-family: ui-monospace, monospace;
    color: var(--pcv-text-3);
    background: var(--badge-grey-bg);
    padding: 2px 8px;
    border-radius: 6px;
  }

  /* ── Chain section ─────────────────────────────────────────────────────── */
  .pp-chain-section { margin-bottom: 1.5rem; }

  .pp-chain-card {
    border-radius: 14px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(245,158,11,.10),
                0 4px 20px rgba(245,158,11,.07);
  }

  /* ── Chat placeholder ──────────────────────────────────────────────────── */
  .pp-chat-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 14px;
    border: 1px dashed var(--pcv-border);
    background: var(--pcv-card);
    opacity: 0.75;
  }

  .pp-chat-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--badge-gold-bg);
    color: var(--badge-gold-text);
  }

  .pp-chat-icon svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .pp-chat-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--pcv-text);
    margin: 0 0 4px;
  }

  .pp-chat-desc {
    font-size: 12px;
    color: var(--pcv-text-2);
    margin: 0;
    line-height: 1.5;
  }

  /* ── Centered state (loading / not-found / no-project) ─────────────────── */
  .pp-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 1rem;
    text-align: center;
    gap: 10px;
    max-width: 26rem;
    margin: 0 auto;
  }

  .pp-state-icon {
    font-size: 2rem;
    color: var(--badge-gold-text);
    opacity: 0.4;
    line-height: 1;
  }

  .pp-state-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--pcv-text);
    margin: 0;
  }

  .pp-state-sub {
    font-size: 0.8125rem;
    color: var(--pcv-text-2);
    margin: 0;
    line-height: 1.5;
  }

  .pp-cta {
    margin-top: 6px;
    padding: 7px 18px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    background: var(--badge-gold-bg);
    color: var(--badge-gold-text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .pp-cta:hover { border-color: var(--gold); }

  /* ── Spinner ───────────────────────────────────────────────────────────── */
  .pp-spinner { display: flex; align-items: center; justify-content: center; }
  .pp-spin-svg { width: 32px; height: 32px; animation: pp-spin 1s linear infinite; }
  .pp-spin-track { fill: none; stroke: var(--pcv-border); stroke-width: 3; }
  .pp-spin-arc   { fill: var(--gold); }
  @keyframes pp-spin { to { transform: rotate(360deg); } }
</style>
