<script>
  /**
   * One in-progress mission — its home inside the rikma.
   *
   * The board (`../`) is the register: a row per mission, aligned for
   * scanning, with the owner's controls inline. This page is the same mission
   * with room to breathe — the brief, the notes, the roles, the links, every
   * task, the month-by-month hours — and the same controls at full size.
   *
   * It is deliberately *connected on both ends*: a back link to the board it
   * came from, and a forward link to the full process chain (decision →
   * offer → execution → approvals) on the process page. No dead ends.
   */
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t, isRtl } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { fetchTimers, initialWebSocketForTimer } from '$lib/stores/timers.js';
  import { segmentsFromTimers } from '$lib/recurring/missionMonths.js';
  import RichText from '$lib/celim/ui/richText.svelte';
  import MonthlyHours from '$lib/components/mission/MonthlyHours.svelte';
  import MissionControls from '$lib/components/mission/MissionControls.svelte';
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import { forum, isChatOpen, newChat, nowChatId } from '$lib/stores/pendMisMes.js';

  let { data } = $props();

  const FALLBACK_AVATAR =
    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

  let projectId = $derived(page.params.projectId);
  let missionId = $derived(page.params.missionId);

  let mission = $derived(data.mission);
  let attrs = $derived(mission?.attributes ?? null);
  let uid = $derived(page.data?.uid != null ? String(page.data.uid) : null);
  let ownerId = $derived(attrs?.users_permissions_user?.data?.id);
  let mine = $derived(uid != null && ownerId != null && String(ownerId) === uid);

  // Locally-applied changes, so the page answers immediately without a reload.
  let statusOverride = $state(/** @type {number|null} */ (null));
  let submitted = $state(false);

  let status = $derived(statusOverride ?? (Number(attrs?.status) || 0));
  let pendingApproval = $derived(
    submitted || (attrs?.finiapruvals?.data ?? []).some((f) => f.attributes?.archived !== true)
  );

  /** The role's name in the viewer's language, falling back to the source one. */
  function roleName(taf) {
    const a = taf?.attributes ?? {};
    if ($lang === 'en') return a.roleDescription;
    return a.localizations?.data?.[0]?.attributes?.roleDescription ?? a.roleDescription;
  }

  function getImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /** @type {Intl.DateTimeFormatOptions} */
  const DATE_OPTS = { year: 'numeric', month: 'long', day: 'numeric' };
  function showDate(value) {
    return value ? new Date(value).toLocaleDateString($lang, DATE_OPTS) : null;
  }

  function hrs(value) {
    return (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  // The monthly ledger needs the mission's timer segments; the rikma-wide qid
  // is the one that carries them, so take it and keep only this mission's.
  /** @type {{start?: string|null, stop?: string|null}[]} */
  let segments = $state([]);

  async function loadSegments() {
    if (!projectId) return;
    try {
      const res = await sendToSer(
        { pid: projectId },
        'projectMissionTimerSegments',
        null,
        null,
        false,
        fetch
      );
      segments = (res?.data?.timers?.data ?? [])
        .filter((x) => String(x.attributes?.mesimabetahalich?.data?.id) === String(missionId))
        .flatMap((x) => segmentsFromTimers([x]));
    } catch (e) {
      console.error('[progress/mission] timer segments failed', e);
    }
  }

  onMount(() => {
    loadSegments();
    const id = page.data?.uid;
    if (!id) return;
    fetchTimers(id, fetch).catch((e) =>
      console.warn('[progress/mission] fetchTimers failed:', e?.message)
    );
    const stopListening = initialWebSocketForTimer(id, fetch);
    return () => stopListening();
  });

  /** Chat opens in the global footer overlay, same as on the board. */
  function openChat() {
    const forumId = attrs?.forums?.data?.[0]?.id;
    if (forumId) {
      nowChatId.set(forumId);
      isChatOpen.set(true);
      return;
    }
    newChat.set({
      started: true,
      created: false,
      id: 0,
      md: { mbId: Number(missionId), pid: Number(projectId) }
    });
    forum.update((f) => ({
      ...f,
      [-1]: {
        loading: false,
        messages: [],
        md: {
          pid: projectId,
          mbId: missionId,
          projectName: attrs?.project?.data?.attributes?.projectName ?? '',
          projectPic: attrs?.project?.data?.attributes?.profilePic?.data?.attributes?.url ?? '',
          mesimaName: attrs?.name
        }
      }
    }));
    nowChatId.set(-1);
    isChatOpen.set(true);
  }

  let missionValue = $derived(
    (Number(attrs?.hoursassinged) || 0) * (Number(attrs?.perhour) || 0)
  );
</script>

<svelte:head>
  <title
    >{attrs?.name ? `${attrs.name} · ` : ''}{$lang === 'he'
      ? 'בתהליך'
      : $lang === 'ar'
        ? 'قيد التنفيذ'
        : 'Progress'} · 1lev1</title
  >
</svelte:head>

<div class="mp" dir={$isRtl ? 'rtl' : 'ltr'}>
  <nav class="mp-nav">
    <a class="mp-back" href="/moach/{projectId}/progress">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#if $isRtl}<polyline points="9 18 15 12 9 6" />{:else}<polyline
            points="15 18 9 12 15 6"
          />{/if}
      </svg>
      {$t('moach.progress.backToBoard')}
    </a>
    {#if mission}
      <a class="mp-back" href="/moach/{projectId}/processes/bm-{missionId}?from=progress">
        {$t('process.months.openProcess')}
      </a>
    {/if}
  </nav>

  {#if !mission}
    <div class="mp-state">
      <span aria-hidden="true">◈</span>
      <p>{$t('moach.process.notFound')}</p>
      <a class="mp-back" href="/moach/{projectId}/progress">{$t('moach.progress.backToBoard')}</a>
    </div>
  {:else}
    <header class="mp-header">
      <div class="mp-header-main">
        <h1 class="mp-title">{attrs.name}</h1>
        <div class="mp-badges">
          {#if mine}<span class="mp-badge mp-badge-mine">★ {$t('moach.progress.mine')}</span>{/if}
          {#if attrs.iskvua}
            <span class="mp-badge">{$t('lev.cards.common.monthlyHours')}</span>
          {/if}
          {#if pendingApproval}
            <span class="mp-badge mp-badge-wait">⏳ {$t('moach.progress.awaitingApproval')}</span>
          {/if}
          {#each attrs.tafkidims?.data ?? [] as taf (taf.id)}
            <span class="mp-badge">{roleName(taf)}</span>
          {/each}
        </div>
      </div>

      <div class="mp-owner">
        <img
          src={getImageUrl(
            attrs.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url
          ) || FALLBACK_AVATAR}
          alt=""
        />
        <span>
          <small>{$t('mission.bethas.by')}</small>
          {attrs.users_permissions_user?.data?.attributes?.username ?? '—'}
        </span>
      </div>
    </header>

    <!-- the numbers, at a glance -->
    <div class="mp-stats">
      <div class="mp-stat">
        <span class="mp-stat-label">{$t('project.bethas.pro')}</span>
        <div class="mp-bar">
          <div class="mp-bar-fill" style:width="{status}%"></div>
          <span class="mp-bar-text">{status}%</span>
        </div>
      </div>
      <div class="mp-stat">
        <span class="mp-stat-label">{$t('project.bethas.hd')}</span>
        <span class="mp-stat-value">
          {hrs(attrs.howmanyhoursalready)} / {hrs(attrs.hoursassinged)}
        </span>
      </div>
      {#if showDate(attrs.start) || showDate(attrs.dates)}
        <div class="mp-stat">
          <span class="mp-stat-label">{$t('project.bethas.monthCol')}</span>
          <span class="mp-stat-value mp-stat-dates">
            {showDate(attrs.start) ?? ''}{showDate(attrs.start) && showDate(attrs.dates)
              ? ' – '
              : ''}{showDate(attrs.dates) ?? ''}
          </span>
        </div>
      {/if}
      {#if projectId}
        <div class="mp-stat">
          <span class="mp-stat-label">{$t('equity.yourShareIfDone')}</span>
          <EquityPreview
            {projectId}
            {missionValue}
            monthlyValue={attrs.iskvua ? missionValue : null}
            alreadyCountedIn="approved"
            compact={true}
          />
        </div>
      {/if}
    </div>

    <!-- the controls, at full size: this is where the work happens. A rikma
         member who isn't the owner still gets the archive/edit proposal
         buttons here — opening one is a rikma-wide consensus matter, not a
         privilege of whoever carries the commitment (PLAN_OBJECT_ARCHIVAL). -->
    <section class="mp-card mp-actions">
      <h2 class="mp-card-title">{$t('moach.progress.actions')}</h2>
      <MissionControls
        {missionId}
        {projectId}
        missionName={attrs.name}
        {status}
        {pendingApproval}
        isMine={mine}
        ownerName={attrs.users_permissions_user?.data?.attributes?.username}
        showArchiveActions={true}
        accruedHours={attrs.howmanyhoursalready}
        hoursAssigned={attrs.hoursassinged}
        perhour={attrs.perhour}
        onStatus={(value) => (statusOverride = value)}
        onCompleted={() => (submitted = true)}
        onTimerSaved={loadSegments}
      />
    </section>

    <div class="mp-cols">
      <div class="mp-col">
        {#if attrs.descrip}
          <section class="mp-card">
            <h2 class="mp-card-title">{$t('lev.cards.inpro.missionDetails')}</h2>
            <div class="mp-rich"><RichText editable={false} outpot={attrs.descrip} /></div>
          </section>
        {/if}

        {#if attrs.hearotMeyuchadot}
          <section class="mp-card mp-card-note">
            <h2 class="mp-card-title">{$t('lev.cards.inpro.notes')}</h2>
            <div class="mp-rich"><RichText editable={false} outpot={attrs.hearotMeyuchadot} /></div>
          </section>
        {/if}

        <section class="mp-card">
          <h2 class="mp-card-title">
            {$t('mission.bethas.actionName')}
            <span class="mp-count">{(attrs.acts?.data ?? []).length}</span>
          </h2>
          {#if (attrs.acts?.data ?? []).length}
            <ul class="mp-acts">
              {#each attrs.acts.data as act (act.id)}
                <li class="mp-act" class:done={act.attributes?.naasa}>
                  <div class="mp-act-head">
                    <span class="mp-act-name">{act.attributes?.shem}</span>
                    {#if act.attributes?.my?.data?.attributes?.username}
                      <span class="mp-act-who"
                        >{act.attributes.my.data.attributes.username}</span
                      >
                    {/if}
                  </div>
                  {#if act.attributes?.des}
                    <p class="mp-act-des">{act.attributes.des}</p>
                  {/if}
                  <div class="mp-bar mp-bar-sm">
                    <div class="mp-bar-fill" style:width="{act.attributes?.status ?? 0}%"></div>
                    <span class="mp-bar-text">{act.attributes?.status ?? 0}%</span>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="mp-empty">{$t('moach.progress.noTasks')}</p>
          {/if}
        </section>
      </div>

      <div class="mp-col">
        <section class="mp-card">
          <h2 class="mp-card-title">{$t('project.bethas.prevMonths')}</h2>
          <MonthlyHours
            monter={attrs.monter}
            {segments}
            hoursassinged={attrs.hoursassinged}
            counter={attrs.howmanyhoursalready}
            showTitle={false}
          />
        </section>

        <section class="mp-card">
          <h2 class="mp-card-title">{$t('moach.progress.discussion')}</h2>
          <button type="button" class="mp-btn" onclick={openChat}>
            💬 {$t('project.bethas.acts')}
          </button>
          {#if attrs.privatlinks || attrs.publicklinks}
            <div class="mp-links">
              {#if attrs.privatlinks}
                <a href={attrs.privatlinks} target="_blank" rel="noreferrer" class="mp-link">
                  🔗 {$t('lev.cards.inpro.taskLink')}
                </a>
              {/if}
              {#if attrs.publicklinks}
                <a href={attrs.publicklinks} target="_blank" rel="noreferrer" class="mp-link">
                  🔗 {$t('lev.cards.inpro.taskLink')}
                </a>
              {/if}
            </div>
          {/if}
          <a class="mp-link" href="/moach/{projectId}/processes/bm-{missionId}?from=progress">
            {$t('process.months.openProcess')}
            {$isRtl ? '←' : '→'}
          </a>
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .mp {
    --mp-gold: var(--gold, #eee8aa);
    --mp-rose: var(--barbi-pink, #ff0092);
    --mp-card: rgba(15, 23, 42, 0.72);
    --mp-border: rgba(148, 163, 184, 0.28);
    --mp-text: #f1f5f9;
    --mp-text-2: #cbd5e1;
    --mp-text-3: #94a3b8;

    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    text-align: start;
    color: var(--mp-text);
    padding-bottom: 2rem;
  }

  .mp-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .mp-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 9999px;
    border: 1px solid var(--mp-border);
    background: var(--mp-card);
    font-size: 12px;
    font-weight: 600;
    color: var(--mp-text-2);
    text-decoration: none;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .mp-back:hover {
    border-color: var(--mp-gold);
    color: var(--mp-gold);
    background: rgba(238, 232, 170, 0.14);
  }
  .mp-back svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .mp-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.1rem;
    border-radius: 16px;
    border: 1px solid var(--mp-border);
    background: var(--mp-card);
  }
  .mp-header-main {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }
  .mp-title {
    margin: 0;
    font-size: clamp(1.15rem, 3.2vw, 1.6rem);
    font-weight: 700;
    color: var(--mp-gold);
    word-break: break-word;
  }
  .mp-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .mp-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border-radius: 9999px;
    font-size: 0.68rem;
    font-weight: 700;
    background: rgba(148, 163, 184, 0.16);
    color: var(--mp-text-3);
  }
  .mp-badge-mine {
    background: rgba(238, 232, 170, 0.18);
    color: var(--mp-gold);
  }
  .mp-badge-wait {
    background: rgba(255, 0, 146, 0.16);
    color: #ff9ad5;
  }

  .mp-owner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--mp-text-2);
  }
  .mp-owner img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(238, 232, 170, 0.4);
  }
  .mp-owner small {
    display: block;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mp-text-3);
  }

  .mp-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.5rem;
  }
  .mp-stat {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 0.65rem 0.8rem;
    border-radius: 14px;
    border: 1px solid var(--mp-border);
    background: var(--mp-card);
  }
  .mp-stat-label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mp-text-3);
  }
  .mp-stat-value {
    font-size: 0.95rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .mp-stat-dates {
    font-size: 0.78rem;
    font-weight: 600;
  }

  .mp-bar {
    position: relative;
    height: 22px;
    border-radius: 9999px;
    background: rgba(2, 6, 23, 0.6);
    border: 1px solid var(--mp-border);
    overflow: hidden;
  }
  .mp-bar-sm {
    height: 16px;
  }
  .mp-bar-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, rgba(238, 232, 170, 0.85), rgba(255, 0, 146, 0.85));
    transition: width 0.3s ease;
  }
  .mp-bar-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.68rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  .mp-cols {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .mp-col {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  @media (min-width: 900px) {
    .mp-cols {
      grid-template-columns: 1.5fr 1fr;
    }
  }

  .mp-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    align-items: flex-start;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    border: 1px solid var(--mp-border);
    background: var(--mp-card);
  }
  .mp-actions {
    border-color: rgba(238, 232, 170, 0.45);
    background: rgba(238, 232, 170, 0.06);
  }
  .mp-card-note {
    border-color: rgba(238, 232, 170, 0.35);
  }
  .mp-card-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mp-gold);
  }
  .mp-count {
    display: inline-flex;
    padding: 0 7px;
    border-radius: 9999px;
    font-size: 0.66rem;
    background: rgba(148, 163, 184, 0.18);
    color: var(--mp-text-2);
  }
  .mp-rich {
    width: 100%;
    font-size: 0.88rem;
    color: var(--mp-text-2);
  }
  .mp-empty {
    margin: 0;
    font-size: 0.8rem;
    color: var(--mp-text-3);
  }

  .mp-acts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
  }
  .mp-act {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0.5rem 0.65rem;
    border-radius: 12px;
    border: 1px solid var(--mp-border);
    background: rgba(2, 6, 23, 0.35);
  }
  .mp-act.done {
    opacity: 0.6;
  }
  .mp-act-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
  }
  .mp-act-name {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .mp-act-who {
    font-size: 0.7rem;
    color: var(--mp-text-3);
  }
  .mp-act-des {
    margin: 0;
    font-size: 0.75rem;
    color: var(--mp-text-3);
  }

  .mp-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0.35rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid var(--mp-border);
    background: rgba(2, 6, 23, 0.4);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--mp-text-2);
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
  }
  .mp-btn:hover {
    border-color: var(--mp-gold);
    color: var(--mp-gold);
  }

  .mp-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .mp-link {
    font-size: 0.78rem;
    color: var(--mp-text-2);
    text-decoration: underline;
  }
  .mp-link:hover {
    color: var(--mp-gold);
  }

  .mp-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 4rem 1rem;
    text-align: center;
    color: var(--mp-text-2);
  }
  .mp-state span {
    font-size: 2rem;
    color: var(--mp-gold);
    opacity: 0.4;
  }
  .mp-state p {
    margin: 0;
  }
</style>
