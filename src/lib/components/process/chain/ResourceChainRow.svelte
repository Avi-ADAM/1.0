<script>
  import ChainNode from './ChainNode.svelte';
  import ChainConnector from './ChainConnector.svelte';

  let {
    chain,
    onOpenModal,
    isExpanded = false,
    onToggle,
    lang = 'en'
  } = $props();

  // ---------------------------------------------------------------------------
  // Localized labels
  // ---------------------------------------------------------------------------
  const labels = {
    he: {
      pmash:          'משאב ממתין',
      open_mashaabim: 'משאב פתוח',
      askms:          'הצעות',
      maap:           'הצבעת אישור',
      rikmash:        'אושר/הושלם',
      offers:         (n) => `${n} הצעות`,
      offersLabel:    (n) => `${n} הצעות — הרחב`,
      collapseOffers: 'כווץ',
      noOffers:       'אין הצעות',
      collapse:       'כווץ',
      openPage:       'פתח עמוד תהליך'
    },
    en: {
      pmash:          'Pending Resource',
      open_mashaabim: 'Open Resource',
      askms:          'Offers',
      maap:           'Approval Vote',
      rikmash:        'Approved',
      offers:         (n) => `${n} ${n === 1 ? 'offer' : 'offers'}`,
      offersLabel:    (n) => `${n} ${n === 1 ? 'offer' : 'offers'} — expand`,
      collapseOffers: 'Collapse',
      noOffers:       'No offers',
      collapse:       'Collapse',
      openPage:       'Open process page'
    },
    ar: {
      pmash:          'مورد معلق',
      open_mashaabim: 'مورد مفتوح',
      askms:          'عروض',
      maap:           'تصويت الموافقة',
      rikmash:        'معتمد',
      offers:         (n) => `${n} عروض`,
      offersLabel:    (n) => `${n} عروض — توسيع`,
      collapseOffers: 'طي',
      noOffers:       'لا توجد عروض',
      collapse:       'طي',
      openPage:       'فتح صفحة العملية'
    }
  };

  let t = $derived(labels[lang] ?? labels.en);

  // ---------------------------------------------------------------------------
  // Visibility flags
  // ---------------------------------------------------------------------------
  let showPmash         = $derived(chain?.pmash != null);
  let showOpenMashaabim = $derived(chain?.openMashaabim != null);
  let showAskms         = $derived((chain?.askms?.length ?? 0) > 0);
  let showMaap          = $derived(chain?.maap != null);
  let showRikmashes     = $derived((chain?.rikmashes?.length ?? 0) > 0);

  let visibleSegments = $derived(() => {
    const s = [];
    if (showPmash)         s.push('pmash');
    if (showOpenMashaabim) s.push('open_mashaabim');
    if (showAskms)         s.push('askms');
    if (showMaap)          s.push('maap');
    if (showRikmashes)     s.push('rikmashes');
    return s;
  });

  function needsConnectorBefore(key) {
    return visibleSegments().indexOf(key) > 0;
  }

  // ---------------------------------------------------------------------------
  // Chain display name
  // ---------------------------------------------------------------------------
  let chainName = $derived(
    chain?.pmash?.attributes?.name ??
    chain?.openMashaabim?.attributes?.name ??
    `#${chain?.id ?? '—'}`
  );

  // ---------------------------------------------------------------------------
  // Mini pipeline
  // ---------------------------------------------------------------------------
  let miniStages = $derived(() => {
    const s = [];
    if (showPmash)         s.push({ color: 'gold',    active: false });
    if (showOpenMashaabim) s.push({ color: 'sky',     active: true  });
    if (showAskms)         s.push({ color: 'violet',  active: false });
    if (showMaap)          s.push({ color: 'gold',    active: false });
    if (showRikmashes)     s.push({ color: 'emerald', active: false });
    return s;
  });

  let currentStage = $derived(() => {
    if (showRikmashes)     return { label: t.rikmash,        cls: 'stage-green' };
    if (showMaap)          return { label: t.maap,            cls: 'stage-gold'  };
    if (showAskms)         return { label: t.askms,           cls: 'stage-violet'};
    if (showOpenMashaabim) return { label: t.open_mashaabim,  cls: 'stage-sky'   };
    if (showPmash)         return { label: t.pmash,           cls: 'stage-gold'  };
    return null;
  });

  // ---------------------------------------------------------------------------
  // Inline offers expand (within expanded view)
  // ---------------------------------------------------------------------------
  let askmsExpanded = $state(false);
  let askmsCount    = $derived(chain?.askms?.length ?? 0);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  function handlePmashClick()          { onOpenModal({ id: chain.pmash.id,          kind: 'pmash'    }); }
  function handleOpenMashaabimClick()  { onOpenModal({ id: chain.openMashaabim.id,  kind: 'openMash' }); }
  function handleMaapClick()           { onOpenModal({ id: chain.maap.id,            kind: 'maap'     }); }
  function handleRikmashClick(rikmash) { onOpenModal({ id: rikmash.id,               kind: 'rikmash'  }); }
</script>

<!-- ── COLLAPSED STRIP ──────────────────────────────────────────────────── -->
{#if !isExpanded}
  <button
    type="button"
    class="strip"
    onclick={onToggle}
    aria-expanded={isExpanded}
  >
    <span class="strip-icon" aria-hidden="true">◇</span>
    <span class="strip-name">{chainName}</span>

    {#if miniStages().length > 0}
      <div class="mini-pipe" aria-hidden="true">
        {#each miniStages() as stage, i}
          {#if i > 0}<div class="mini-line"></div>{/if}
          <div
            class="mini-dot mini-dot--{stage.color}"
            class:mini-dot--pulse={stage.active}
          ></div>
        {/each}
      </div>
    {/if}

    {#if currentStage()}
      {@const cs = currentStage()}
      <span class="stage-badge {cs.cls}">{cs.label}</span>
    {/if}

    <svg class="strip-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

<!-- ── EXPANDED VIEW ────────────────────────────────────────────────────── -->
{:else}
  <div class="expanded">
    <div class="exp-header">
      <span class="exp-icon" aria-hidden="true">◇</span>
      <span class="exp-name">{chainName}</span>
      <button type="button" class="exp-collapse-btn" onclick={onToggle}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        {t.collapse}
      </button>
    </div>

    <div class="exp-body">
      <div class="chain-row">

        {#if showPmash}
          {#if needsConnectorBefore('pmash')}<ChainConnector {lang} />{/if}
          <ChainNode
            label={t.pmash}
            name={chain.pmash.attributes?.name ?? chain.pmash.id}
            status={chain.pmash.attributes?.archived ? (lang === 'he' ? 'ארכיון' : 'Archived') : (lang === 'he' ? 'ממתין' : 'Pending')}
            statusColor={chain.pmash.attributes?.archived ? 'grey' : 'yellow'}
            user={null}
            hasForum={false}
            onClick={handlePmashClick}
            {lang}
          />
        {/if}

        {#if showOpenMashaabim}
          {#if needsConnectorBefore('open_mashaabim')}<ChainConnector {lang} />{/if}
          <ChainNode
            label={t.open_mashaabim}
            name={chain.openMashaabim.attributes?.name ?? chain.openMashaabim.id}
            status={chain.openMashaabim.attributes?.archived ? (lang === 'he' ? 'ארכיון' : 'Archived') : (lang === 'he' ? 'פתוח' : 'Open')}
            statusColor={chain.openMashaabim.attributes?.archived ? 'grey' : 'blue'}
            user={null}
            hasForum={false}
            onClick={handleOpenMashaabimClick}
            {lang}
          />
        {/if}

        {#if showAskms}
          {#if needsConnectorBefore('askms')}<ChainConnector {lang} />{/if}
          <div class="askms-node">
            <button
              type="button"
              class="askms-badge"
              aria-label={askmsExpanded ? t.collapseOffers : t.offersLabel(askmsCount)}
              aria-expanded={askmsExpanded}
              onclick={() => (askmsExpanded = !askmsExpanded)}
            >
              <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span class="askms-label">{t.askms}</span>
              <span role="status" class="askms-count">{askmsCount}</span>
              <svg
                viewBox="0 0 24 24"
                class="chevron"
                class:chevron--up={askmsExpanded}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {#if askmsExpanded}
              <div class="askms-list" role="list">
                {#if askmsCount === 0}
                  <p class="askms-empty">{t.noOffers}</p>
                {:else}
                  {#each chain.askms as askm (askm.id)}
                    <div class="askm-item" role="listitem">
                      <span class="askm-name">{askm.attributes?.name ?? askm.id}</span>
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        {#if showMaap}
          {#if needsConnectorBefore('maap')}<ChainConnector {lang} />{/if}
          <ChainNode
            label={t.maap}
            name={chain.maap.attributes?.name ?? chain.maap.id}
            status={chain.maap.attributes?.archived ? (lang === 'he' ? 'ארכיון' : 'Archived') : (lang === 'he' ? 'ממתין' : 'Pending')}
            statusColor={chain.maap.attributes?.archived ? 'grey' : 'yellow'}
            user={null}
            hasForum={false}
            onClick={handleMaapClick}
            {lang}
          />
        {/if}

        {#if showRikmashes}
          {#if needsConnectorBefore('rikmashes')}<ChainConnector {lang} />{/if}
          <div class="rikmashes-group">
            {#each chain.rikmashes as rikmash (rikmash.id)}
              <ChainNode
                label={t.rikmash}
                name={rikmash.attributes?.name ?? rikmash.id}
                status={lang === 'he' ? 'אושר' : 'Approved'}
                statusColor="green"
                user={null}
                hasForum={false}
                onClick={() => handleRikmashClick(rikmash)}
                {lang}
              />
            {/each}
          </div>
        {/if}

      </div>

      <div class="exp-footer">
        <a href="/moach/process/{chain.id}" class="open-page-link">
          {t.openPage}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ── Collapsed strip ───────────────────────────────────────────────────── */
  .strip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: start;
    min-height: 44px;
    transition: background 0.12s;
  }
  .strip:hover { background: var(--pcv-card-hover, #fef9ec); }
  .strip:focus-visible { outline: 2px solid var(--gold, #f59e0b); outline-offset: -2px; }

  .strip-icon { font-size: 10px; color: var(--badge-sky-text, #0369a1); flex-shrink: 0; line-height: 1; }
  .strip-name {
    flex: 1 1 6rem;
    font-size: 13px;
    font-weight: 500;
    color: var(--pcv-text, #1c1917);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Mini pipeline ─────────────────────────────────────────────────────── */
  .mini-pipe { display: flex; align-items: center; flex-shrink: 0; gap: 0; }
  @media (max-width: 420px) { .mini-pipe { display: none; } }

  .mini-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .mini-line { width: 9px; height: 1.5px; background: rgba(245,158,11,.25); flex-shrink: 0; }
  .mini-dot--gold    { background: var(--gold, #f59e0b); }
  .mini-dot--sky     { background: #38bdf8; }
  .mini-dot--violet  { background: #a78bfa; }
  .mini-dot--emerald { background: #34d399; }
  .mini-dot--pulse { animation: dot-pulse 2s ease-in-out infinite; }
  @keyframes dot-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,.55); }
    50%       { box-shadow: 0 0 0 3px rgba(56,189,248,.0); }
  }

  /* ── Stage badge ───────────────────────────────────────────────────────── */
  .stage-badge {
    display: inline-flex; align-items: center;
    border-radius: 9999px; padding: 2px 9px;
    font-size: 11px; font-weight: 600;
    flex-shrink: 0; white-space: nowrap;
  }
  .stage-gold   { background: var(--badge-gold-bg,  rgba(245,158,11,.12)); color: var(--badge-gold-text,  #b45309); }
  .stage-green  { background: var(--badge-green-bg, rgba(  5,150,105,.10)); color: var(--badge-green-text, #065f46); }
  .stage-sky    { background: var(--badge-sky-bg,   rgba(  2,132,199,.10)); color: var(--badge-sky-text,   #0369a1); }
  .stage-violet { background: rgba(124,58,237,.10); color: #6d28d9; }

  .strip-chevron {
    width: 14px; height: 14px;
    fill: none; stroke: var(--pcv-text-3, #a8a29e);
    stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
    flex-shrink: 0; margin-inline-start: auto;
  }

  /* ── Expanded ──────────────────────────────────────────────────────────── */
  .expanded { display: flex; flex-direction: column; }

  .exp-header {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px 6px;
    border-bottom: 1px solid var(--pcv-border, #f3e8c8);
  }
  .exp-icon  { font-size: 10px; color: var(--badge-sky-text, #0369a1); flex-shrink: 0; }
  .exp-name  { flex: 1; font-size: 13px; font-weight: 600; color: var(--pcv-text, #1c1917); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .exp-collapse-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 9999px;
    border: 1px solid var(--pcv-border, #e7e5e4);
    background: transparent; font-size: 11px; font-weight: 600;
    color: var(--pcv-text-2, #78716c); cursor: pointer; flex-shrink: 0;
    transition: background 0.12s, border-color 0.12s;
  }
  .exp-collapse-btn:hover {
    background: var(--badge-gold-bg, rgba(245,158,11,.08));
    border-color: var(--gold, #f59e0b);
    color: var(--badge-gold-text, #b45309);
  }
  .exp-collapse-btn svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

  .exp-body { padding: 12px 14px 10px; }
  .chain-row { display: flex; flex-direction: row; flex-wrap: wrap; align-items: flex-start; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
  .rikmashes-group { display: flex; flex-direction: column; gap: 5px; }

  /* ── Offers (askms) node ───────────────────────────────────────────────── */
  .askms-node { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 5rem; }

  .askms-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 9999px;
    border: 1px solid rgba(124,58,237,.25);
    background: rgba(124,58,237,.08);
    color: #6d28d9; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: background 0.12s, border-color 0.12s; white-space: nowrap;
  }
  .askms-badge:hover { background: rgba(124,58,237,.14); border-color: #6d28d9; }
  .icon { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
  .askms-label { font-size: 11px; }
  .askms-count { font-size: 13px; font-weight: 700; }
  .chevron { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; transition: transform 0.2s; }
  .chevron--up { transform: rotate(180deg); }

  .askms-list {
    width: 100%; min-width: 10rem; max-width: 16rem; max-height: 14rem;
    overflow-y: auto; border-radius: 8px;
    border: 1px solid var(--pcv-border, #e7e5e4);
    background: var(--pcv-node-bg, #ffffff);
    box-shadow: 0 4px 16px rgba(0,0,0,.08);
  }
  .askms-empty { padding: 8px 12px; font-size: 12px; color: var(--pcv-text-3, #a8a29e); }
  .askm-item { padding: 7px 12px; border-bottom: 1px solid var(--pcv-border, #e7e5e4); }
  .askm-item:last-child { border-bottom: none; }
  .askm-name { font-size: 12px; font-weight: 500; color: var(--pcv-text, #1c1917); }

  /* ── Footer ────────────────────────────────────────────────────────────── */
  .exp-footer {
    display: flex; justify-content: flex-end;
    margin-top: 10px; padding-top: 8px;
    border-top: 1px solid var(--pcv-border, #f3e8c8);
  }
  .open-page-link {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    text-decoration: none; padding: 3px 8px; border-radius: 6px;
    transition: color 0.12s, background 0.12s;
  }
  .open-page-link:hover { color: var(--badge-gold-text, #b45309); background: var(--badge-gold-bg, rgba(245,158,11,.08)); }
  .open-page-link svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
