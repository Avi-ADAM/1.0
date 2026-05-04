<script>
  import ChainNode from './ChainNode.svelte';
  import ChainConnector from './ChainConnector.svelte';
  import AsksNode from './AsksNode.svelte';
  import ActsGroup from './ActsGroup.svelte';

  let {
    chain,
    loadedItems,
    loadingIds,
    projectId,
    projectUsers = [],
    onOpenModal,
    onOpenActModal,
    onOpenChat,
    onLazyLoad,
    isExpanded = false,
    onToggle,
    lang = 'en'
  } = $props();

  // ---------------------------------------------------------------------------
  // Localized labels
  // ---------------------------------------------------------------------------
  const labels = {
    he: {
      pendm: 'משימה ממתינה',
      open_mission: 'משימה פתוחה',
      asks: 'בקשות',
      mesimabetahalich: 'בביצוע',
      acts: 'מטלות',
      finiapruval: 'אישור סיום',
      finnished_mission: 'הושלמה',
      loadBtn: 'טען משימה שהסתיימה',
      loading: 'טוען…',
      collapse: 'כווץ',
      openPage: 'פתח עמוד תהליך'
    },
    en: {
      pendm: 'Pending Mission',
      open_mission: 'Open Mission',
      asks: 'Asks',
      mesimabetahalich: 'In Progress',
      acts: 'Acts',
      finiapruval: 'Final Approval',
      finnished_mission: 'Completed',
      loadBtn: 'Load completed mission',
      loading: 'Loading…',
      collapse: 'Collapse',
      openPage: 'Open process page'
    },
    ar: {
      pendm: 'مهمة معلقة',
      open_mission: 'مهمة مفتوحة',
      asks: 'طلبات',
      mesimabetahalich: 'قيد التنفيذ',
      acts: 'مهام',
      finiapruval: 'موافقة نهائية',
      finnished_mission: 'مكتملة',
      loadBtn: 'تحميل المهمة المكتملة',
      loading: 'جارٍ التحميل…',
      collapse: 'طي',
      openPage: 'فتح صفحة العملية'
    }
  };

  let t = $derived(labels[lang] ?? labels.en);

  // ---------------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------------
  let bethaIsActive = $derived(
    chain?.mesimabetahalich?.attributes?.finnished != true
  );

  let bethaStatusColor = $derived(bethaIsActive ? 'rose' : 'grey');

  let bethaUser = $derived(() => {
    const userData =
      chain?.mesimabetahalich?.attributes?.users_permissions_user?.data;
    if (!userData) return null;
    const attrs = userData.attributes ?? {};
    return {
      username: attrs.username ?? '',
      profilePicUrl: attrs.profilePic?.data?.attributes?.url ?? null
    };
  });

  let bethaHasForum = $derived(
    (chain?.mesimabetahalich?.attributes?.forums?.data?.length ?? 0) > 0
  );

  $effect(() => {
    console.log(
      '[MCR]',
      chain?.id,
      '| om=',
      chain?.openMission?.id ?? 'NULL',
      '| asks=',
      chain?.openMission?.attributes?.asks?.data?.length ?? 'no-field',
      '| showAsks=',
      (chain?.openMission?.attributes?.asks?.data?.length ?? 0) > 0
    );
  });

  let asksArray = $derived(() => {
    // asks live on openMission, not pendm — field: open_mission.attributes.asks.data
    const raw = chain?.openMission?.attributes?.asks?.data ?? [];
    return raw.map((ask) => {
      const userId = String(
        ask?.attributes?.users_permissions_user?.data?.id ?? ''
      );
      const directUsername =
        ask?.attributes?.users_permissions_user?.data?.attributes?.username;
      const lookedUp = userId
        ? projectUsers.find((u) => String(u.id) === userId)?.attributes
            ?.username
        : undefined;
      return {
        userId,
        username: directUsername ?? lookedUp ?? `#${userId || ask?.id || '?'}`,
        forumId: ask?.attributes?.forums?.data?.[0]?.id ?? null
      };
    });
  });

  let loadedFinnished = $derived(
    chain?.finnishedMissionId
      ? (loadedItems?.get(chain.finnishedMissionId) ?? null)
      : null
  );

  let finnishedLoading = $derived(
    chain?.finnishedMissionId
      ? (loadingIds?.has(chain.finnishedMissionId) ?? false)
      : false
  );

  // ---------------------------------------------------------------------------
  // Visibility flags
  // ---------------------------------------------------------------------------
  let showPendm = $derived(chain?.pendm != null);
  let showOpenMission = $derived(chain?.openMission != null);
  let showAsks = $derived(
    (chain?.openMission?.attributes?.asks?.data?.length ?? 0) > 0
  );
  let showBetha = $derived(chain?.mesimabetahalich != null);
  let showActs = $derived((chain?.acts?.length ?? 0) > 0);
  let showFiniapruvals = $derived((chain?.finiapruvals?.length ?? 0) > 0);
  let showFinnished = $derived(
    chain?.finnishedMissionId != null || chain?.finnishedMission != null
  );

  let visibleSegments = $derived(() => {
    const s = [];
    if (showPendm) s.push('pendm');
    if (showOpenMission) s.push('open_mission');
    if (showAsks) s.push('asks');
    if (showBetha) s.push('mesimabetahalich');
    if (showActs) s.push('acts');
    if (showFiniapruvals) s.push('finiapruvals');
    if (showFinnished) s.push('finnished_mission');
    return s;
  });

  function needsConnectorBefore(key) {
    const segs = visibleSegments();
    return segs.indexOf(key) > 0;
  }

  // ---------------------------------------------------------------------------
  // Chain display name (collapsed header)
  // ---------------------------------------------------------------------------
  let chainName = $derived(
    chain?.pendm?.attributes?.name ??
      chain?.openMission?.attributes?.name ??
      chain?.mesimabetahalich?.attributes?.name ??
      `#${chain?.id ?? '—'}`
  );

  // ---------------------------------------------------------------------------
  // Mini pipeline for collapsed strip
  // ---------------------------------------------------------------------------
  let miniStages = $derived(() => {
    const s = [];
    if (showPendm) s.push({ color: 'gold', active: false });
    if (showOpenMission) s.push({ color: 'sky', active: false });
    if (showAsks) s.push({ color: 'blue', active: false });
    if (showBetha)
      s.push({ color: bethaIsActive ? 'rose' : 'zinc', active: bethaIsActive });
    if (showActs) s.push({ color: 'violet', active: false });
    if (showFiniapruvals) s.push({ color: 'gold', active: false });
    if (showFinnished) s.push({ color: 'emerald', active: false });
    return s;
  });

  // Current stage badge for collapsed strip
  let currentStage = $derived(() => {
    if (showFinnished)
      return { label: t.finnished_mission, cls: 'stage-green' };
    if (showFiniapruvals) return { label: t.finiapruval, cls: 'stage-gold' };
    if (showBetha)
      return {
        label: t.mesimabetahalich,
        cls: bethaIsActive ? 'stage-rose' : 'stage-grey'
      };
    if (showOpenMission) return { label: t.open_mission, cls: 'stage-sky' };
    if (showPendm) return { label: t.pendm, cls: 'stage-gold' };
    return null;
  });

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  function handlePendmClick() {
    onOpenModal({ id: chain.pendm.id, kind: 'pendm' });
  }
  function handleOpenMissionClick() {
    onOpenModal({ id: chain.openMission.id, kind: 'openM' });
  }
  function handleBethaClick() {
    onOpenModal({ id: chain.mesimabetahalich.id, kind: 'betha' });
  }

  function handleFinnishedClick() {
    const entity = loadedFinnished ?? chain?.finnishedMission;
    if (entity) onOpenModal({ id: entity.id, kind: 'done' });
  }

  function handleBethaChatClick() {
    const forumId = chain?.mesimabetahalich?.attributes?.forums?.data?.[0]?.id;
    if (forumId) onOpenChat({ id: forumId, isNew: false });
  }

  function handleLazyLoadClick() {
    if (chain?.finnishedMissionId) onLazyLoad(chain.finnishedMissionId);
  }
</script>

<!-- ── COLLAPSED STRIP ──────────────────────────────────────────────────── -->
{#if !isExpanded}
  <button
    type="button"
    class="strip"
    onclick={onToggle}
    aria-expanded={isExpanded}
  >
    <!-- Diamond icon -->
    <span class="strip-icon" aria-hidden="true">◆</span>

    <!-- Chain name -->
    <span class="strip-name">{chainName}</span>

    <!-- Mini pipeline dots -->
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

    <!-- Current stage badge -->
    {#if currentStage()}
      {@const cs = currentStage()}
      <span class="stage-badge {cs.cls}">{cs.label}</span>
    {/if}

    <!-- Expand chevron -->
    <svg class="strip-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  <!-- ── EXPANDED VIEW ────────────────────────────────────────────────────── -->
{:else}
  <div class="expanded">
    <!-- Header with collapse button -->
    <div class="exp-header">
      <span class="exp-icon" aria-hidden="true">◆</span>
      <span class="exp-name">{chainName}</span>
      <button type="button" class="exp-collapse-btn" onclick={onToggle}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        {t.collapse}
      </button>
    </div>

    <!-- Chain nodes -->
    <div class="exp-body">
      <div class="chain-row">
        {#if showPendm}
          {#if needsConnectorBefore('pendm')}<ChainConnector {lang} />{/if}
          <ChainNode
            label={t.pendm}
            name={chain.pendm.attributes?.name ?? chain.pendm.id}
            status={chain.pendm.attributes?.archived
              ? lang === 'he'
                ? 'ארכיון'
                : 'Archived'
              : lang === 'he'
                ? 'ממתין'
                : 'Pending'}
            statusColor={chain.pendm.attributes?.archived ? 'grey' : 'yellow'}
            user={null}
            hasForum={false}
            onClick={handlePendmClick}
            {lang}
          />
        {/if}

        {#if showOpenMission}
          {#if needsConnectorBefore('open_mission')}<ChainConnector
              {lang}
            />{/if}
          <ChainNode
            label={t.open_mission}
            name={chain.openMission.attributes?.name ?? chain.openMission.id}
            status={chain.openMission.attributes?.archived
              ? lang === 'he'
                ? 'ארכיון'
                : 'Archived'
              : lang === 'he'
                ? 'פתוח'
                : 'Open'}
            statusColor={chain.openMission.attributes?.archived
              ? 'grey'
              : 'blue'}
            user={null}
            hasForum={false}
            onClick={handleOpenMissionClick}
            {lang}
          />
        {/if}

        {#if showAsks}
          {#if needsConnectorBefore('asks')}<ChainConnector {lang} />{/if}
          <AsksNode asks={asksArray()} {lang} />
        {/if}

        {#if showBetha}
          {#if needsConnectorBefore('mesimabetahalich')}<ChainConnector
              {lang}
            />{/if}
          <ChainNode
            label={t.mesimabetahalich}
            name={chain.mesimabetahalich.attributes?.name ??
              chain.mesimabetahalich.id}
            status={bethaIsActive
              ? lang === 'he'
                ? 'פעיל'
                : 'Active'
              : lang === 'he'
                ? 'ארכיון'
                : 'Archived'}
            statusColor={bethaStatusColor}
            user={bethaUser()}
            hasForum={bethaHasForum}
            onClick={handleBethaClick}
            onChatClick={bethaHasForum ? handleBethaChatClick : null}
            {lang}
          />
        {/if}

        {#if showActs}
          {#if needsConnectorBefore('acts')}<ChainConnector {lang} />{/if}
          <ActsGroup acts={chain.acts} onActClick={onOpenActModal} {lang} />
        {/if}

        {#if showFiniapruvals}
          {#if needsConnectorBefore('finiapruvals')}<ChainConnector
              {lang}
            />{/if}
          <div class="fini-group">
            {#each chain.finiapruvals as fini (fini.id)}
              <ChainNode
                label={t.finiapruval}
                name={fini.attributes?.missname ?? fini.id}
                status={fini.attributes?.archived
                  ? lang === 'he'
                    ? 'ארכיון'
                    : 'Archived'
                  : lang === 'he'
                    ? 'ממתין'
                    : 'Pending'}
                statusColor={fini.attributes?.archived ? 'grey' : 'yellow'}
                user={null}
                hasForum={false}
                onClick={() => onOpenModal({ id: fini.id, kind: 'fini' })}
                {lang}
              />
            {/each}
          </div>
        {/if}

        {#if showFinnished}
          {#if needsConnectorBefore('finnished_mission')}<ChainConnector
              {lang}
            />{/if}

          {#if loadedFinnished || chain?.finnishedMission}
            {@const entity = loadedFinnished ?? chain.finnishedMission}
            <ChainNode
              label={t.finnished_mission}
              name={entity.attributes?.missionName ?? entity.id}
              status={lang === 'he' ? 'הושלם' : 'Completed'}
              statusColor="green"
              user={null}
              hasForum={false}
              onClick={handleFinnishedClick}
              {lang}
            />
          {:else if chain?.finnishedMissionId}
            <div class="lazy-card">
              <span class="lazy-label">{t.finnished_mission}</span>
              {#if finnishedLoading}
                <div class="lazy-loading" aria-live="polite">
                  <svg class="spinner" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="spinner-track" cx="12" cy="12" r="10" />
                    <path class="spinner-arc" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t.loading}</span>
                </div>
              {:else}
                <button
                  type="button"
                  class="lazy-btn"
                  onclick={handleLazyLoadClick}
                >
                  {t.loadBtn}
                </button>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
      <!-- /chain-row -->

      <!-- Footer: link to full page (future) -->
      <div class="exp-footer">
        <a href="/moach/{projectId}/processes/{chain.id}" class="open-page-link" tabindex="0">
          {t.openPage}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
    <!-- /exp-body -->
  </div>
  <!-- /expanded -->
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

  .strip:hover {
    background: var(--pcv-card-hover, #fef9ec);
  }
  .strip:focus-visible {
    outline: 2px solid var(--gold, #f59e0b);
    outline-offset: -2px;
  }

  .strip-icon {
    font-size: 10px;
    color: var(--gold, #f59e0b);
    flex-shrink: 0;
    line-height: 1;
  }

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
  .mini-pipe {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 0;
  }

  @media (max-width: 420px) {
    .mini-pipe {
      display: none;
    }
  }

  .mini-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .mini-line {
    width: 9px;
    height: 1.5px;
    background: rgba(245, 158, 11, 0.25);
    flex-shrink: 0;
  }

  .mini-dot--gold {
    background: var(--gold, #f59e0b);
  }
  .mini-dot--sky {
    background: #38bdf8;
  }
  .mini-dot--blue {
    background: #60a5fa;
  }
  .mini-dot--rose {
    background: #fb7185;
  }
  .mini-dot--violet {
    background: #a78bfa;
  }
  .mini-dot--emerald {
    background: #34d399;
  }
  .mini-dot--zinc {
    background: #52525b;
  }

  .mini-dot--pulse {
    animation: dot-pulse 2s ease-in-out infinite;
  }
  @keyframes dot-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(251, 113, 133, 0.55);
    }
    50% {
      box-shadow: 0 0 0 3px rgba(251, 113, 133, 0);
    }
  }

  /* ── Current stage badge ───────────────────────────────────────────────── */
  .stage-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 2px 9px;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .stage-gold {
    background: var(--badge-gold-bg, rgba(245, 158, 11, 0.12));
    color: var(--badge-gold-text, #b45309);
  }
  .stage-rose {
    background: var(--badge-rose-bg, rgba(225, 29, 72, 0.1));
    color: var(--badge-rose-text, #be123c);
  }
  .stage-green {
    background: var(--badge-green-bg, rgba(5, 150, 105, 0.1));
    color: var(--badge-green-text, #065f46);
  }
  .stage-sky {
    background: var(--badge-sky-bg, rgba(2, 132, 199, 0.1));
    color: var(--badge-sky-text, #0369a1);
  }
  .stage-grey {
    background: var(--badge-grey-bg, rgba(107, 114, 128, 0.1));
    color: var(--badge-grey-text, #6b7280);
  }

  /* ── Chevron ───────────────────────────────────────────────────────────── */
  .strip-chevron {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: var(--pcv-text-3, #a8a29e);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
    margin-inline-start: auto;
  }

  /* ── Expanded view ─────────────────────────────────────────────────────── */
  .expanded {
    display: flex;
    flex-direction: column;
  }

  .exp-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px 6px;
    border-bottom: 1px solid var(--pcv-border, #f3e8c8);
  }

  .exp-icon {
    font-size: 10px;
    color: var(--gold, #f59e0b);
    flex-shrink: 0;
  }

  .exp-name {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--pcv-text, #1c1917);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exp-collapse-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border, #e7e5e4);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background 0.12s,
      border-color 0.12s;
  }
  .exp-collapse-btn:hover {
    background: var(--badge-gold-bg, rgba(245, 158, 11, 0.08));
    border-color: var(--gold, #f59e0b);
    color: var(--badge-gold-text, #b45309);
  }
  .exp-collapse-btn svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* ── Expanded body ─────────────────────────────────────────────────────── */
  .exp-body {
    padding: 12px 14px 10px;
  }

  .chain-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .fini-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  /* ── Lazy placeholder ──────────────────────────────────────────────────── */
  .lazy-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 8rem;
    max-width: 13rem;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px dashed var(--pcv-border, #e7e5e4);
    background: transparent;
  }

  .lazy-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3, #a8a29e);
  }

  .lazy-loading {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--pcv-text-2, #78716c);
  }

  .spinner {
    width: 14px;
    height: 14px;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
  }
  .spinner-track {
    fill: none;
    stroke: var(--pcv-border, #e7e5e4);
    stroke-width: 3;
  }
  .spinner-arc {
    fill: var(--gold, #f59e0b);
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .lazy-btn {
    padding: 4px 10px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border, #e7e5e4);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    cursor: pointer;
    transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s;
  }
  .lazy-btn:hover {
    background: var(--badge-gold-bg, rgba(245, 158, 11, 0.08));
    border-color: var(--gold, #f59e0b);
    color: var(--badge-gold-text, #b45309);
  }

  /* ── Footer ────────────────────────────────────────────────────────────── */
  .exp-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--pcv-border, #f3e8c8);
  }

  .open-page-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    text-decoration: none;
    padding: 3px 8px;
    border-radius: 6px;
    transition:
      color 0.12s,
      background 0.12s;
  }
  .open-page-link:hover {
    color: var(--badge-gold-text, #b45309);
    background: var(--badge-gold-bg, rgba(245, 158, 11, 0.08));
  }
  .open-page-link svg {
    width: 11px;
    height: 11px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
