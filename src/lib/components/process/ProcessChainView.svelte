<script>
  /**
   * ProcessChainView — top-level component for the "Process Chains" tab (tab 13).
   *
   * Receives all mission and resource data already loaded by the moach page,
   * reconstructs chains client-side via pure functions, and renders them as
   * collapsible strips. Each chain can be expanded to show full node detail.
   *
   * Requirements: 1.3, 1.4, 1.5, 5.2, 5.3, 5.4, 5.5, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3
   */

  import { toast } from 'svelte-sonner';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { reconstructMissionChains, reconstructResourceChains } from '$lib/utils/reconstructChains.js';
  import MissionChainRow from './chain/MissionChainRow.svelte';
  import ResourceChainRow from './chain/ResourceChainRow.svelte';

  // ---------------------------------------------------------------------------
  // Props
  // ---------------------------------------------------------------------------
  let {
    pmiData        = [],
    omiData        = [],
    bmiData        = [],
    fmiData        = [],
    opmash         = [],
    rikmashes      = [],
    acts           = [],
    extraOmiData   = [],
    extraPmiData   = [],
    projectId      = '',
    projectUsers   = [],
    isLoadingExtra = false,
    onOpenModal,
    onOpenActModal,
    onOpenChat,
    lang           = 'en'
  } = $props();

  // ---------------------------------------------------------------------------
  // Chain reconstruction — merge extra (archived) data before reconstructing
  // ---------------------------------------------------------------------------
  let allOmiData = $derived([...omiData, ...extraOmiData]);
  let allPmiData = $derived([...pmiData, ...extraPmiData]);

  let missionChains  = $derived(reconstructMissionChains(allPmiData, allOmiData, bmiData, fmiData, acts));
  let resourceChains = $derived(reconstructResourceChains(opmash, rikmashes));

  // Active = process not finished (or no betahalich yet)
  // Archived = mesimabetahalich.finnished === true (fully completed process)
  let activeChains   = $derived(missionChains.filter(c =>
    c.mesimabetahalich?.attributes?.finnished !== true
  ));
  let archivedChains = $derived(missionChains.filter(c =>
    c.mesimabetahalich?.attributes?.finnished === true
  ));

  // ---------------------------------------------------------------------------
  // Expand / collapse state — one Set tracks which chain IDs are open
  // ---------------------------------------------------------------------------
  let expandedChains = $state(new Set());
  let archiveOpen    = $state(false);

  function toggleChain(id) {
    const next = new Set(expandedChains);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedChains = next;
  }

  // ---------------------------------------------------------------------------
  // Lazy-load for finnished_missions
  // ---------------------------------------------------------------------------
  let loadedItems = $state(new Map());
  let loadingIds  = $state(new Set());

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
      toast.error(lang === 'he' ? 'שגיאה בטעינת המשימה שהסתיימה' : 'Failed to load completed mission');
    } finally {
      const next = new Set(loadingIds);
      next.delete(id);
      loadingIds = next;
    }
  }

  // ---------------------------------------------------------------------------
  // i18n
  // ---------------------------------------------------------------------------
  const i18n = {
    he: {
      missionSection:  'שרשראות משימות',
      resourceSection: 'שרשראות משאבים',
      archiveSection:  'ארכיון — תהליכים שהסתיימו',
      empty:           'לא נמצאו שרשראות תהליך לפרויקט זה',
      loadingExtra:    'טוען נתונים נוספים…'
    },
    en: {
      missionSection:  'Mission Chains',
      resourceSection: 'Resource Chains',
      archiveSection:  'Archive — Completed Processes',
      empty:           'No process chains found for this project',
      loadingExtra:    'Loading additional data…'
    },
    ar: {
      missionSection:  'سلاسل المهام',
      resourceSection: 'سلاسل الموارد',
      archiveSection:  'الأرشيف — العمليات المكتملة',
      empty:           'لم يتم العثور على سلاسل عمليات لهذا المشروع',
      loadingExtra:    'جارٍ تحميل بيانات إضافية…'
    }
  };

  let t       = $derived(i18n[lang] ?? i18n.en);
  let isEmpty = $derived(activeChains.length === 0 && archivedChains.length === 0 && resourceChains.length === 0 && !isLoadingExtra);
</script>

<!--
  dir is set on root — all children inherit RTL/LTR.
  CSS custom properties cascade from .pcv to all descendant components.
-->
<div class="pcv" dir={lang === 'he' ? 'rtl' : 'ltr'}>

  <!-- Loading banner — visible even when partial chains already exist -->
  {#if isLoadingExtra}
    <div class="pcv-loading-bar" role="status" aria-live="polite">
      <svg class="pcv-spinner" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span class="pcv-loading-text">{t.loadingExtra}</span>
    </div>
  {/if}

  {#if isEmpty}
    <div class="pcv-empty">
      <svg viewBox="0 0 24 24" class="pcv-empty-icon" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
      <p class="pcv-empty-text">{t.empty}</p>
    </div>

  {:else}

    <!-- ── MISSION CHAINS ──────────────────────────────────────────────────── -->
    {#if activeChains.length > 0}
      <section class="pcv-section" aria-labelledby="mission-heading">
        <h2 id="mission-heading" class="pcv-heading">
          <span class="pcv-heading-icon" aria-hidden="true">◈</span>
          {t.missionSection}
          <span class="pcv-heading-count">{activeChains.length}</span>
        </h2>

        <div class="pcv-list">
          {#each activeChains as chain (chain.id)}
            {@const isExpanded = expandedChains.has(chain.id)}
            <div
              class="pcv-card"
              class:pcv-card--expanded={isExpanded}
            >
              <MissionChainRow
                {chain}
                {loadedItems}
                {loadingIds}
                {projectId}
                {projectUsers}
                {onOpenModal}
                {onOpenActModal}
                {onOpenChat}
                onLazyLoad={handleLazyLoad}
                {isExpanded}
                onToggle={() => toggleChain(chain.id)}
                {lang}
              />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ── RESOURCE CHAINS ─────────────────────────────────────────────────── -->
    {#if resourceChains.length > 0}
      <section class="pcv-section" aria-labelledby="resource-heading">
        <h2 id="resource-heading" class="pcv-heading pcv-heading--resource">
          <span class="pcv-heading-icon" aria-hidden="true">◇</span>
          {t.resourceSection}
          <span class="pcv-heading-count pcv-heading-count--sky">{resourceChains.length}</span>
        </h2>

        <div class="pcv-list">
          {#each resourceChains as chain (chain.id)}
            {@const isExpanded = expandedChains.has(chain.id)}
            <div
              class="pcv-card pcv-card--resource"
              class:pcv-card--expanded={isExpanded}
            >
              <ResourceChainRow
                {chain}
                {projectId}
                {onOpenModal}
                {isExpanded}
                onToggle={() => toggleChain(chain.id)}
                {lang}
              />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ── ARCHIVE — fully finished processes (mesimabetahalich.finnished=true) -->
    {#if archivedChains.length > 0}
      <section class="pcv-section pcv-section--archive" aria-labelledby="archive-heading">
        <button
          type="button"
          class="pcv-archive-toggle"
          id="archive-heading"
          onclick={() => (archiveOpen = !archiveOpen)}
          aria-expanded={archiveOpen}
        >
          <span class="pcv-heading-icon pcv-heading-icon--archive" aria-hidden="true">◫</span>
          <span class="pcv-heading-text">{t.archiveSection}</span>
          <span class="pcv-heading-count pcv-heading-count--grey">{archivedChains.length}</span>
          <svg class="pcv-archive-chevron" class:pcv-archive-chevron--open={archiveOpen} viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {#if archiveOpen}
          <div class="pcv-list pcv-list--archive">
            {#each archivedChains as chain (chain.id)}
              {@const isExpanded = expandedChains.has(chain.id)}
              <div
                class="pcv-card pcv-card--archive"
                class:pcv-card--expanded={isExpanded}
              >
                <MissionChainRow
                  {chain}
                  {loadedItems}
                  {loadingIds}
                  {projectId}
                  {projectUsers}
                  {onOpenModal}
                  {onOpenActModal}
                  {onOpenChat}
                  onLazyLoad={handleLazyLoad}
                  {isExpanded}
                  onToggle={() => toggleChain(chain.id)}
                  {lang}
                />
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

  {/if}
</div>

<style>
  /* ══════════════════════════════════════════════════════════════════════════
     Design-token cascade root — all CSS vars defined here flow to every
     child component via natural DOM inheritance.
     ══════════════════════════════════════════════════════════════════════════ */
  .pcv {
    /* ── Accent palette ────────────────────────────────────────────────── */
    --gold:   #d97706;    /* amber-600  — warm gold, readable on white */
    --gold-h: #f59e0b;    /* amber-500  — hover/highlight gold          */
    --rose:   #be123c;    /* rose-700                                   */
    --rose-h: #e11d48;    /* rose-600   — hover rose                    */

    /* ── Light-mode surfaces ───────────────────────────────────────────── */
    --pcv-bg:           #fffbf0;   /* warm off-white with gold tint     */
    --pcv-card:         #ffffff;
    --pcv-card-hover:   #fef9ec;
    --pcv-node-bg:      #ffffff;
    --pcv-node-hover:   #fffbf0;
    --pcv-node-border:  #e7e5e4;
    --pcv-border:       #f3e8c8;   /* warm gold-tinted dividers         */
    --pcv-text:         #1c1917;
    --pcv-text-2:       #78716c;
    --pcv-text-3:       #a8a29e;

    /* ── Light-mode badge tokens ───────────────────────────────────────── */
    --badge-gold-bg:    rgba(217,119,  6, .10);
    --badge-gold-text:  #b45309;   /* amber-700                         */
    --badge-rose-bg:    rgba(225, 29, 72, .10);
    --badge-rose-text:  #be123c;   /* rose-700                          */
    --badge-green-bg:   rgba(  5,150,105, .10);
    --badge-green-text: #065f46;   /* emerald-900                       */
    --badge-sky-bg:     rgba(  2,132,199, .10);
    --badge-sky-text:   #0369a1;   /* sky-700                           */
    --badge-grey-bg:    rgba(107,114,128, .10);
    --badge-grey-text:  #6b7280;   /* gray-500                          */

    /* ── Component layout ──────────────────────────────────────────────── */
    min-height: 8rem;
    padding: 1rem;
    background: var(--pcv-bg);
    transition: background 0.2s;
  }

  /* ── Dark-mode token overrides ─────────────────────────────────────────── */
  @media (prefers-color-scheme: dark) {
    .pcv {
      --gold:   #fbbf24;    /* amber-400 — bright on dark */
      --gold-h: #f59e0b;
      --rose:   #fb7185;    /* rose-400                   */
      --rose-h: #f43f5e;

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

  /* ── Section ───────────────────────────────────────────────────────────── */
  .pcv-section { margin-bottom: 1.5rem; }

  /* ── Section heading ───────────────────────────────────────────────────── */
  .pcv-heading {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-gold-text);
  }

  .pcv-heading--resource { color: var(--badge-sky-text); }

  .pcv-heading-icon { font-size: 1em; opacity: 0.75; line-height: 1; }

  .pcv-heading-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    background: var(--badge-gold-bg);
    color: var(--badge-gold-text);
    border: 1px solid var(--badge-gold-bg);
  }

  .pcv-heading-count--sky {
    background: var(--badge-sky-bg);
    color: var(--badge-sky-text);
    border-color: var(--badge-sky-bg);
  }

  /* ── Chain list ────────────────────────────────────────────────────────── */
  .pcv-list { display: flex; flex-direction: column; gap: 4px; }

  /* ── Chain card wrapper ────────────────────────────────────────────────── */
  .pcv-card {
    border-radius: 12px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .pcv-card:hover {
    border-color: rgba(245,158,11, .35);
  }

  .pcv-card--resource:hover {
    border-color: rgba(2,132,199, .30);
  }

  .pcv-card--expanded {
    border-color: rgba(245,158,11, .55);
    box-shadow: 0 0 0 1px rgba(245,158,11, .12),
                0 4px 20px rgba(245,158,11, .08);
  }

  .pcv-card--resource.pcv-card--expanded {
    border-color: rgba(2,132,199, .45);
    box-shadow: 0 0 0 1px rgba(2,132,199, .10),
                0 4px 20px rgba(2,132,199, .07);
  }

  /* ── Empty state ───────────────────────────────────────────────────────── */
  .pcv-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
    text-align: center;
  }

  .pcv-empty-icon {
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 0.75rem;
    fill: none;
    stroke: var(--pcv-text-3);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.45;
  }

  .pcv-empty-text {
    font-size: 0.875rem;
    color: var(--pcv-text-3);
  }

  /* ── Archive section ──────────────────────────────────────────────────── */
  .pcv-archive-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding: 3px 6px 3px 2px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.12s;
  }
  .pcv-archive-toggle:hover {
    background: var(--badge-grey-bg, rgba(107,114,128,.08));
  }
  .pcv-archive-toggle:focus-visible {
    outline: 2px solid var(--pcv-text-3, #a8a29e);
    outline-offset: 2px;
  }

  .pcv-heading-text {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-grey-text, #6b7280);
  }

  .pcv-heading-icon--archive {
    font-size: 1em;
    opacity: 0.6;
    line-height: 1;
    color: var(--badge-grey-text, #6b7280);
  }

  .pcv-heading-count--grey {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    background: var(--badge-grey-bg, rgba(107,114,128,.10));
    color: var(--badge-grey-text, #6b7280);
    border: 1px solid var(--badge-grey-bg, rgba(107,114,128,.10));
  }

  .pcv-archive-chevron {
    width: 13px;
    height: 13px;
    fill: none;
    stroke: var(--pcv-text-3, #a8a29e);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
    transition: transform 0.18s;
  }
  .pcv-archive-chevron:global(.pcv-archive-chevron--open) {
    transform: rotate(180deg);
  }

  .pcv-list--archive {
    opacity: 0.85;
  }

  .pcv-card--archive {
    border-color: var(--badge-grey-bg, rgba(107,114,128,.12));
  }
  .pcv-card--archive:hover {
    border-color: rgba(107,114,128,.30);
  }
  .pcv-card--archive:global(.pcv-card--expanded) {
    border-color: rgba(107,114,128,.40);
    box-shadow: 0 0 0 1px rgba(107,114,128,.08),
                0 4px 20px rgba(107,114,128,.06);
  }

  /* ── Loading bar (shown while supplemental data is being fetched) ──────── */
  .pcv-loading-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: var(--badge-gold-bg, rgba(245,158,11,.10));
    border: 1px solid rgba(245,158,11,.25);
  }

  .pcv-loading-text {
    font-size: 12px;
    font-weight: 500;
    color: var(--badge-gold-text, #b45309);
  }

  /* ── Loading spinner ───────────────────────────────────────────────────── */
  .pcv-spinner {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    animation: pcv-spin 1s linear infinite;
    fill: none;
  }
  .pcv-spinner circle {
    stroke: rgba(245,158,11,.3);
    stroke-width: 3;
  }
  .pcv-spinner path {
    fill: var(--gold, #f59e0b);
  }
  @keyframes pcv-spin { to { transform: rotate(360deg); } }
</style>
