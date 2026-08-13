<script>
  /**
   * The rikma's in-progress board — every mission someone is actually working
   * on right now, in one list.
   *
   * Two things it has to be at once:
   *  1. a *scannable* register for the whole rikma (who is on what, how far
   *     along, how many hours, what it will be worth) — aligned columns on a
   *     wide screen, stacked cards on a narrow one, in the moach's own dark
   *     slate + gold palette rather than the old green/teal slab;
   *  2. the *home* of the viewer's own missions: a mission of yours carries the
   *     same controls the lev card gives it — run/stop the timer, save the
   *     logged time, move the percentage, submit for approval — so you do not
   *     have to go to the lev page to work.
   *
   * Anything wider than that (the full decision → offer → execution → approval
   * chain, the negotiation, the archive) lives on the process page; every row
   * links there, and that page links back here.
   */
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { t, isRtl } from '$lib/translations';
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { toast } from 'svelte-sonner';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import Crtask from '$lib/components/prPr/tasks/crtask.svelte';
  import Close from '$lib/celim/close.svelte';
  import MonthlyHours from '$lib/components/mission/MonthlyHours.svelte';
  import MissionControls from '$lib/components/mission/MissionControls.svelte';
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { buildMonthlyLedger, segmentsFromTimers } from '$lib/recurring/missionMonths.js';
  import { htmlExcerpt } from '$lib/text/htmlExcerpt';

  /**
   * @typedef {Object} Props
   * @property {any[]} [bmiData] - `mesimabetahaliches` nodes of the rikma.
   * @property {string|null} [projectId]
   * @property {(payload: any) => void} [onChat]
   * @property {(actId: any) => void} [onActClick]
   */

  /** @type {Props} */
  let { bmiData = [], projectId = null, onChat, onActClick } = $props();

  const FALLBACK_AVATAR =
    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

  let uid = $derived(page.data?.uid != null ? String(page.data.uid) : null);

  // ── Role legend + colours ───────────────────────────────────────────────────
  // One stable colour per role across the whole board, assigned in the order
  // the roles first appear so the legend and the rows always agree.
  const ROLE_COLORS = [
    '#7dd3fc', // sky
    '#2effa8', // green
    '#eee8aa', // gold
    '#f9a8d4', // pink
    '#c4b5fd', // violet
    '#fdba74', // orange
    '#67e8f9', // cyan
    '#fca5a5' // red
  ];

  /** The role's name in the viewer's language, falling back to the source one. */
  function roleName(taf) {
    const a = taf?.attributes ?? {};
    if ($lang === 'en') return a.roleDescription;
    return a.localizations?.data?.[0]?.attributes?.roleDescription ?? a.roleDescription;
  }

  let roles = $derived.by(() => {
    /** @type {{id: string, name: string, color: string, count: number}[]} */
    const out = [];
    const seen = new Map();
    for (const m of bmiData ?? []) {
      for (const taf of m.attributes?.tafkidims?.data ?? []) {
        const id = String(taf.id);
        if (seen.has(id)) {
          out[seen.get(id)].count += 1;
          continue;
        }
        seen.set(id, out.length);
        out.push({
          id,
          name: roleName(taf),
          color: ROLE_COLORS[out.length % ROLE_COLORS.length],
          count: 1
        });
      }
    }
    return out;
  });

  let colorOfRole = $derived(new Map(roles.map((r) => [r.id, r.color])));

  // ── Filters ─────────────────────────────────────────────────────────────────
  let search = $state('');
  let mineOnly = $state(false);
  /** @type {string[]} — empty means "every role". */
  let activeRoles = $state([]);

  function toggleRole(id) {
    activeRoles = activeRoles.includes(id)
      ? activeRoles.filter((r) => r !== id)
      : [...activeRoles, id];
  }

  function isMine(m) {
    const ownerId = m.attributes?.users_permissions_user?.data?.id;
    return uid != null && ownerId != null && String(ownerId) === uid;
  }

  function haystack(m) {
    const a = m.attributes ?? {};
    return [
      a.name,
      htmlExcerpt(a.descrip, 2000),
      htmlExcerpt(a.hearotMeyuchadot, 1000),
      a.users_permissions_user?.data?.attributes?.username,
      ...(a.tafkidims?.data ?? []).map(roleName),
      ...(a.acts?.data ?? []).map((x) => x.attributes?.shem)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  let q = $derived(search.trim().toLowerCase());

  /**
   * Missions the server closed outright in this session (solo rikma — the
   * finish needs nobody else's approval). They are no longer in progress, so
   * they leave the board immediately instead of sitting under a ⏳ badge that
   * waits for an approval that was never created.
   * @type {Record<string, boolean>}
   */
  let completedNow = $state({});

  let shown = $derived(
    (bmiData ?? []).filter((m) => {
      if (mineOnly && !isMine(m)) return false;
      if (activeRoles.length) {
        const ids = (m.attributes?.tafkidims?.data ?? []).map((x) => String(x.id));
        if (!ids.some((id) => activeRoles.includes(id))) return false;
      }
      if (q && !haystack(m).includes(q)) return false;
      if (completedNow[String(m.id)]) return false;
      return true;
    })
  );

  let mineCount = $derived((bmiData ?? []).filter(isMine).length);

  // Mine first — this board is the member's workbench before it is a register.
  let ordered = $derived(
    [...shown].sort((a, b) => (isMine(b) ? 1 : 0) - (isMine(a) ? 1 : 0))
  );

  // ── Per-row local state ─────────────────────────────────────────────────────
  /** @type {Record<string, boolean>} */
  let openRows = $state({});
  /** Progress saved from the row, before the next server load carries it. */
  /** @type {Record<string, number>} */
  let statusOverride = $state({});
  /** Missions submitted for approval in this session. */
  /** @type {Record<string, boolean>} */
  let submitted = $state({});

  function toggleRow(id) {
    openRows = { ...openRows, [id]: !openRows[id] };
  }

  function statusOf(m) {
    const o = statusOverride[String(m.id)];
    if (o != null) return o;
    return Number(m.attributes?.status) || 0;
  }

  /** A finish approval already on the table — no second submission from here. */
  function isPending(m) {
    if (submitted[String(m.id)]) return true;
    return (m.attributes?.finiapruvals?.data ?? []).some(
      (f) => f.attributes?.archived !== true
    );
  }

  // ── Live monthly hours ──────────────────────────────────────────────────────
  // `howmanyhoursalready` is a month-less counter that only moves when a timer
  // is *saved*, so it under-reports the month in progress and says nothing
  // about a timer running right now. The timer segments are the only
  // month-aware record, so they are fetched separately (their own qid —
  // getProjectMissions feeds eight pages and doesn't need the weight) and the
  // months are derived from them with the same arithmetic /api/monthi files.
  /** @type {Record<string, {start?: string|null, stop?: string|null}[]>} */
  let segmentsByMission = $state({});
  let tickNow = $state(new Date());
  let tick = null;

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
      /** @type {Record<string, any[]>} */
      const map = {};
      for (const timer of res?.data?.timers?.data ?? []) {
        const mid = timer.attributes?.mesimabetahalich?.data?.id;
        if (!mid) continue;
        map[String(mid)] = [...(map[String(mid)] ?? []), ...segmentsFromTimers([timer])];
      }
      segmentsByMission = map;

      // A segment with no `stop` is a timer running now — re-read the clock
      // while it runs so the row keeps counting up on its own.
      clearInterval(tick);
      const running = Object.values(map).some((segs) => segs.some((s) => s?.start && !s.stop));
      if (running) tick = setInterval(() => (tickNow = new Date()), 30_000);
    } catch (e) {
      console.error('[bethas] live timer segments failed', e);
    }
  }

  onMount(loadSegments);
  onDestroy(() => clearInterval(tick));

  /** The month-by-month ledger of one mission, current month included. */
  function ledgerOf(m) {
    return buildMonthlyLedger({
      rows: m.attributes?.monter,
      segments: segmentsByMission[String(m.id)] ?? [],
      hoursassinged: m.attributes?.hoursassinged,
      counter: m.attributes?.howmanyhoursalready,
      now: tickNow
    });
  }

  function hrs(value) {
    return (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function avatarOf(m) {
    return (
      m.attributes?.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url ??
      FALLBACK_AVATAR
    );
  }

  /** The mission's own page — its brief, notes, tasks, ledger and controls. */
  function missionHref(m) {
    return `/moach/${projectId}/progress/${m.id}`;
  }

  /** One step further out: the whole chain this mission belongs to. */
  function processHref(m) {
    return `/moach/${projectId}/processes/bm-${m.id}?from=progress`;
  }

  // ── Chat + task creation ────────────────────────────────────────────────────
  function chat(m) {
    const forums = m.attributes?.forums?.data ?? [];
    onChat?.({
      forumId: forums.length ? forums[0].id : 0,
      missionId: m.id,
      missionName: m.attributes?.name
    });
  }

  let taskDialogOpen = $state(false);
  let taskMissionId = $state(0);
  // The task form's own bindable fields (assignee + dates) — it owns them, the
  // board only has to hold them.
  let taskUser = $state(undefined);
  let taskFrom = $state(undefined);
  let taskUntil = $state(undefined);

  function openTaskDialog(missionId) {
    taskMissionId = missionId;
    taskDialogOpen = true;
  }

  function taskCreated() {
    taskDialogOpen = false;
    toast.success($t('mission.bethas.taskCreated'));
  }

  // `crtask` reads the role list off the missions it is given; it only needs
  // id + name, so hand it the legend we already built.
  let proles = $derived(roles.map((r) => ({ id: r.id, name: r.name })));
</script>

<DialogOverlay style="z-index: 700;" isOpen={taskDialogOpen} onDismiss={() => (taskDialogOpen = false)}>
  <div style="z-index: 700;">
    <DialogContent class="formi" aria-label="form">
      <div style="z-index: 400;" dir={$isRtl ? 'rtl' : 'ltr'}>
        <button class="hover:bg-barbi text-mturk rounded-full" onclick={() => (taskDialogOpen = false)}>
          <Close />
        </button>
        <Crtask
          id={taskMissionId}
          {proles}
          {bmiData}
          misid={undefined}
          bind:userMevatzeaId={taskUser}
          bind:mimatai={taskFrom}
          bind:adMatai={taskUntil}
          onDone={taskCreated}
        />
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<section class="pb" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="pb-head">
    <div class="pb-title-row">
      <h1 class="pb-title">{$t('mission.bethas.heading')}</h1>
      <span class="pb-count">{(bmiData ?? []).length}</span>
      {#if mineCount > 0}
        <span class="pb-count pb-count-mine">{$t('moach.progress.mineCount', { count: mineCount })}</span>
      {/if}
    </div>

    <div class="pb-tools">
      <input
        type="search"
        bind:value={search}
        placeholder={$t('moach.progress.searchPh')}
        class="pb-search"
      />
      {#if mineCount > 0}
        <button
          type="button"
          class="pb-chip"
          class:active={mineOnly}
          onclick={() => (mineOnly = !mineOnly)}
        >
          ★ {$t('moach.progress.mineOnly')}
        </button>
      {/if}
      <button type="button" class="pb-chip pb-chip-add" onclick={() => openTaskDialog(0)}>
        + {$t('moach.progress.addTask')}
      </button>
    </div>

    {#if roles.length > 1}
      <div class="pb-roles" role="group" aria-label={$t('project.bethas.ro')}>
        {#each roles as role (role.id)}
          <button
            type="button"
            class="pb-role"
            class:active={activeRoles.includes(role.id)}
            style:--role-color={role.color}
            onclick={() => toggleRole(role.id)}
          >
            <span class="pb-role-dot" aria-hidden="true"></span>
            {role.name}
            <span class="pb-role-count">{role.count}</span>
          </button>
        {/each}
        {#if activeRoles.length}
          <button type="button" class="pb-role pb-role-clear" onclick={() => (activeRoles = [])}>
            ✕ {$t('moach.progress.clearFilter')}
          </button>
        {/if}
      </div>
    {/if}
  </header>

  {#if (bmiData ?? []).length === 0}
    <p class="pb-empty">{$t('moach.progress.empty')}</p>
  {:else if ordered.length === 0}
    <p class="pb-empty">{$t('moach.progress.emptyFiltered')}</p>
  {:else}
    <!-- Column headings: a real table reading on a wide screen, and nothing at
         all on a narrow one, where each row stacks with its own labels. -->
    <div class="pb-colheads" class:no-equity={!projectId} aria-hidden="true">
      <span>{$t('mission.bethas.missionName')}</span>
      <span>{$t('mission.bethas.by')}</span>
      <span>{$t('project.bethas.pro')}</span>
      <span>{$t('project.bethas.hd')}</span>
      {#if projectId}<span>{$t('equity.yourShareIfDone')}</span>{/if}
      <span>{$t('project.bethas.ro')}</span>
      <span class="pb-col-end">{$t('project.bethas.acts')}</span>
    </div>

    <ul class="pb-rows">
      {#each ordered as m (m.id)}
        {@const ledger = ledgerOf(m)}
        {@const mine = isMine(m)}
        {@const open = !!openRows[String(m.id)]}
        {@const acts = m.attributes?.acts?.data ?? []}
        <li class="pb-row" class:mine class:open>
          <div class="pb-grid" class:no-equity={!projectId}>
            <!-- name -->
            <div class="pb-cell pb-cell-name">
              {#if projectId}
                <a class="pb-name" href={missionHref(m)} title={$t('moach.progress.openMission')}>
                  {m.attributes?.name}
                  <span class="pb-name-arrow" aria-hidden="true">{$isRtl ? '←' : '→'}</span>
                </a>
              {:else}
                <span class="pb-name">{m.attributes?.name}</span>
              {/if}
              <div class="pb-badges">
                {#if mine}<span class="pb-badge pb-badge-mine">★ {$t('moach.progress.mine')}</span>{/if}
                {#if m.attributes?.iskvua}
                  <span class="pb-badge">{$t('lev.cards.common.monthlyHours')}</span>
                {/if}
                {#if isPending(m)}
                  <span class="pb-badge pb-badge-wait">⏳ {$t('moach.progress.awaitingApproval')}</span>
                {/if}
              </div>
            </div>

            <!-- owner -->
            <div class="pb-cell pb-cell-owner">
              <span class="pb-cell-label">{$t('mission.bethas.by')}</span>
              <span class="pb-owner">
                <img src={avatarOf(m)} alt="" loading="lazy" />
                <span class="pb-owner-name"
                  >{m.attributes?.users_permissions_user?.data?.attributes?.username ?? '—'}</span
                >
              </span>
            </div>

            <!-- progress -->
            <div class="pb-cell pb-cell-progress">
              <span class="pb-cell-label">{$t('project.bethas.pro')}</span>
              <div class="pb-bar" role="img" aria-label="{statusOf(m)}%">
                <div class="pb-bar-fill" style:width="{statusOf(m)}%"></div>
                <span class="pb-bar-text">{statusOf(m)}%</span>
              </div>
            </div>

            <!-- hours -->
            <div class="pb-cell pb-cell-hours">
              <span class="pb-cell-label">{$t('project.bethas.hd')}</span>
              <span class="pb-hours">
                <strong>{hrs(ledger.openMonth?.hoursDone ?? 0)}</strong>
                <span class="pb-hours-sep">/</span>
                {hrs(m.attributes?.hoursassinged)}
              </span>
              {#if ledger.totalDone > (ledger.openMonth?.hoursDone ?? 0)}
                <span class="pb-hours-total"
                  >{$t('project.bethas.totalAllMonths')}: {hrs(ledger.totalDone)}</span
                >
              {/if}
            </div>

            <!-- equity: what your share of the rikma is worth once this is done.
                 The mission already counts in approvedInProgressValue ⇒
                 alreadyCountedIn="approved" (never add V twice). -->
            {#if projectId}
              <div class="pb-cell pb-cell-equity">
                <span class="pb-cell-label">{$t('equity.yourShareIfDone')}</span>
                <EquityPreview
                  {projectId}
                  missionValue={(Number(m.attributes?.hoursassinged) || 0) *
                    (Number(m.attributes?.perhour) || 0)}
                  monthlyValue={m.attributes?.iskvua
                    ? (Number(m.attributes?.hoursassinged) || 0) *
                      (Number(m.attributes?.perhour) || 0)
                    : null}
                  alreadyCountedIn="approved"
                  compact={true}
                />
              </div>
            {/if}

            <!-- roles -->
            <div class="pb-cell pb-cell-roles">
              <span class="pb-cell-label">{$t('project.bethas.ro')}</span>
              <span class="pb-role-tags">
                {#each m.attributes?.tafkidims?.data ?? [] as taf (taf.id)}
                  <span class="pb-tag" style:--role-color={colorOfRole.get(String(taf.id)) ?? '#94a3b8'}>
                    {roleName(taf)}
                  </span>
                {/each}
              </span>
            </div>

            <!-- row actions -->
            <div class="pb-cell pb-cell-actions">
              <button
                type="button"
                class="pb-icon"
                onclick={() => chat(m)}
                title={$t('project.bethas.acts')}
                aria-label={$t('project.bethas.acts')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12,3C6.5,3 2,6.6 2,11C2,13.2 3.1,15.2 5,16.5V22L10.3,18.8C10.9,18.9 11.4,19 12,19C17.5,19 22,15.4 22,11C22,6.6 17.5,3 12,3M12,17C11.5,17 11,17 10.5,16.9L7,19V16.3C5.2,15.2 4,13.2 4,11C4,7.7 7.6,5 12,5C16.4,5 20,7.7 20,11C20,14.3 16.4,17 12,17Z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="pb-icon"
                onclick={() => openTaskDialog(m.id)}
                title={$t('moach.progress.addTask')}
                aria-label={$t('moach.progress.addTask')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
              <button
                type="button"
                class="pb-icon pb-expand"
                class:rotated={open}
                onclick={() => toggleRow(m.id)}
                title={$t('moach.progress.details')}
                aria-label={$t('moach.progress.details')}
                aria-expanded={open}
              >
                {#if acts.length}<span class="pb-icon-count">{acts.length}</span>{/if}
                <svg viewBox="0 0 10 6" aria-hidden="true">
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    fill="none"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- the viewer's own mission gets the full workbench (timer, status,
               complete); any rikma member also gets the archive/edit proposal
               buttons on someone else's mission — opening one is a rikma-wide
               consensus matter, not a privilege of the owner
               (PLAN_OBJECT_ARCHIVAL). -->
          {#if projectId}
            <div class="pb-mine-bar">
              <MissionControls
                missionId={m.id}
                {projectId}
                missionName={m.attributes?.name}
                status={statusOf(m)}
                pendingApproval={isPending(m)}
                isMine={mine}
                ownerName={m.attributes?.users_permissions_user?.data?.attributes?.username}
                showArchiveActions={true}
                accruedHours={m.attributes?.howmanyhoursalready}
                hoursAssigned={m.attributes?.hoursassinged}
                perhour={m.attributes?.perhour}
                compact={true}
                onStatus={(value) => (statusOverride = { ...statusOverride, [String(m.id)]: value })}
                onCompleted={(outcome) =>
                  outcome === 'completed'
                    ? (completedNow = { ...completedNow, [String(m.id)]: true })
                    : (submitted = { ...submitted, [String(m.id)]: true })}
                onTimerSaved={loadSegments}
              />
            </div>
          {/if}

          {#if open}
            <div class="pb-panel" transition:slide={{ duration: 220, easing: quintOut }}>
              <div class="pb-panel-grid">
                <div class="pb-panel-block">
                  <h3 class="pb-panel-title">
                    {$t('mission.bethas.actionName')}
                    <span class="pb-count">{acts.length}</span>
                  </h3>
                  {#if acts.length}
                    <ul class="pb-acts">
                      {#each acts as act (act.id)}
                        <li>
                          <button type="button" class="pb-act" onclick={() => onActClick?.(act.id)}>
                            <span class="pb-act-name">{act.attributes?.shem}</span>
                            {#if act.attributes?.des}
                              <span class="pb-act-des">{act.attributes.des}</span>
                            {/if}
                            <span class="pb-act-bar">
                              <span
                                class="pb-act-fill"
                                style:width="{act.attributes?.status ?? 0}%"
                              ></span>
                            </span>
                            <span class="pb-act-pct">{act.attributes?.status ?? 0}%</span>
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    <p class="pb-panel-empty">{$t('moach.progress.noTasks')}</p>
                  {/if}
                  <button type="button" class="pb-chip pb-chip-add" onclick={() => openTaskDialog(m.id)}>
                    + {$t('moach.progress.addTask')}
                  </button>
                </div>

                <div class="pb-panel-block">
                  <h3 class="pb-panel-title">{$t('project.bethas.prevMonths')}</h3>
                  <MonthlyHours
                    monter={m.attributes?.monter}
                    segments={segmentsByMission[String(m.id)] ?? []}
                    hoursassinged={m.attributes?.hoursassinged}
                    counter={m.attributes?.howmanyhoursalready}
                    showTitle={false}
                  />
                  {#if projectId}
                    <div class="pb-panel-links">
                      <a class="pb-panel-link" href={missionHref(m)}>
                        {$t('moach.progress.openMission')}
                        {$isRtl ? '←' : '→'}
                      </a>
                      <a class="pb-panel-link" href={processHref(m)}>
                        {$t('process.months.openProcess')}
                        {$isRtl ? '←' : '→'}
                      </a>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  /* The board lives inside the moach shell (dark slate radial gradient), so it
     is always dark and paints its own tokens rather than inheriting a theme. */
  .pb {
    --pb-gold: var(--gold, #eee8aa);
    --pb-rose: var(--barbi-pink, #ff0092);
    --pb-card: rgba(15, 23, 42, 0.72);
    --pb-card-hover: rgba(30, 41, 59, 0.82);
    --pb-border: rgba(148, 163, 184, 0.28);
    --pb-text: #f1f5f9;
    --pb-text-2: #cbd5e1;
    --pb-text-3: #94a3b8;

    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    text-align: start;
    color: var(--pb-text);
    padding: 0.25rem 0.25rem 2rem;
  }

  /* ── header ─────────────────────────────────────────────────────────────── */
  .pb-head {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .pb-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pb-title {
    margin: 0;
    font-size: clamp(1.05rem, 3vw, 1.45rem);
    font-weight: 700;
    color: var(--pb-gold);
  }
  .pb-count {
    display: inline-flex;
    align-items: center;
    padding: 1px 9px;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    background: rgba(148, 163, 184, 0.16);
    color: var(--pb-text-2);
  }
  .pb-count-mine {
    background: rgba(238, 232, 170, 0.16);
    color: var(--pb-gold);
  }

  .pb-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }
  .pb-search {
    flex: 1 1 12rem;
    min-width: 10rem;
    border-radius: 9999px;
    border: 1px solid rgba(238, 232, 170, 0.45);
    background: rgba(2, 6, 23, 0.55);
    padding: 0.35rem 0.9rem;
    font-size: 0.82rem;
    color: var(--pb-text);
  }
  .pb-search::placeholder {
    color: var(--pb-text-3);
  }
  .pb-search:focus {
    outline: none;
    border-color: var(--pb-gold);
  }

  .pb-chip {
    border-radius: 9999px;
    border: 1px solid rgba(238, 232, 170, 0.4);
    background: var(--pb-card);
    padding: 0.28rem 0.8rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--pb-gold);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .pb-chip:hover {
    border-color: var(--pb-gold);
  }
  .pb-chip.active {
    background: var(--pb-rose);
    border-color: var(--pb-rose);
    color: var(--pb-gold);
  }
  .pb-chip-add {
    color: var(--pb-text-2);
    border-color: var(--pb-border);
  }
  .pb-chip-add:hover {
    color: var(--pb-gold);
    border-color: var(--pb-gold);
  }

  .pb-roles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .pb-role {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 9999px;
    border: 1px solid var(--pb-border);
    background: var(--pb-card);
    padding: 0.2rem 0.7rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--pb-text-2);
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
  }
  .pb-role:hover {
    border-color: var(--role-color, var(--pb-gold));
    color: var(--pb-text);
  }
  .pb-role.active {
    border-color: var(--role-color, var(--pb-gold));
    background: color-mix(in srgb, var(--role-color, #94a3b8) 18%, transparent);
    color: var(--pb-text);
  }
  .pb-role-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--role-color, #94a3b8);
  }
  .pb-role-count {
    opacity: 0.6;
  }
  .pb-role-clear {
    color: var(--pb-text-3);
  }

  .pb-empty {
    margin: 0;
    padding: 2.5rem 1rem;
    text-align: center;
    font-size: 0.9rem;
    color: var(--pb-text-3);
    border: 1px dashed var(--pb-border);
    border-radius: 14px;
  }

  /* ── the grid shared by the column heads and every row ───────────────────── */
  .pb-colheads {
    display: none;
  }

  .pb-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pb-row {
    border: 1px solid var(--pb-border);
    border-radius: 14px;
    background: var(--pb-card);
    overflow: hidden;
    transition: border-color 0.12s, background 0.12s;
  }
  .pb-row:hover {
    background: var(--pb-card-hover);
  }
  .pb-row.mine {
    border-color: rgba(238, 232, 170, 0.45);
    box-shadow: inset 3px 0 0 0 var(--pb-gold);
  }
  :global([dir='rtl']) .pb-row.mine {
    box-shadow: inset -3px 0 0 0 var(--pb-gold);
  }
  .pb-row.open {
    border-color: rgba(238, 232, 170, 0.5);
  }

  .pb-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem 0.75rem;
    padding: 0.75rem 0.9rem;
    align-items: center;
  }

  .pb-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .pb-cell-label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pb-text-3);
  }

  .pb-name {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--pb-text);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid transparent;
    transition: color 0.12s, border-color 0.12s;
  }
  a.pb-name:hover,
  a.pb-name:focus-visible {
    color: var(--pb-gold);
    border-bottom-color: currentColor;
  }
  .pb-name-arrow {
    font-size: 0.8em;
    opacity: 0;
    transition: opacity 0.12s;
  }
  a.pb-name:hover .pb-name-arrow,
  a.pb-name:focus-visible .pb-name-arrow {
    opacity: 0.9;
  }

  .pb-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .pb-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 0.64rem;
    font-weight: 700;
    background: rgba(148, 163, 184, 0.16);
    color: var(--pb-text-3);
  }
  .pb-badge-mine {
    background: rgba(238, 232, 170, 0.18);
    color: var(--pb-gold);
  }
  .pb-badge-wait {
    background: rgba(255, 0, 146, 0.16);
    color: #ff9ad5;
  }

  .pb-owner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .pb-owner img {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(238, 232, 170, 0.4);
    flex: none;
  }
  .pb-owner-name {
    font-size: 0.8rem;
    color: var(--pb-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pb-bar {
    position: relative;
    height: 20px;
    border-radius: 9999px;
    background: rgba(2, 6, 23, 0.6);
    border: 1px solid var(--pb-border);
    overflow: hidden;
  }
  .pb-bar-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, rgba(238, 232, 170, 0.85), rgba(255, 0, 146, 0.85));
    transition: width 0.3s ease;
  }
  .pb-bar-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--pb-text);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  .pb-hours {
    font-size: 0.85rem;
    color: var(--pb-text-2);
    font-variant-numeric: tabular-nums;
  }
  .pb-hours strong {
    color: var(--pb-text);
  }
  .pb-hours-sep {
    opacity: 0.5;
    margin: 0 2px;
  }
  .pb-hours-total {
    font-size: 0.66rem;
    color: var(--pb-text-3);
  }

  .pb-role-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .pb-tag {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 0.66rem;
    font-weight: 600;
    border: 1px solid var(--role-color, #94a3b8);
    background: color-mix(in srgb, var(--role-color, #94a3b8) 16%, transparent);
    color: var(--role-color, #94a3b8);
  }

  .pb-cell-actions {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
  }
  .pb-icon {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 5px;
    border-radius: 9999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--pb-text-3);
    cursor: pointer;
    transition: color 0.12s, background 0.12s, border-color 0.12s;
  }
  .pb-icon:hover {
    color: var(--pb-gold);
    background: rgba(238, 232, 170, 0.12);
    border-color: rgba(238, 232, 170, 0.4);
  }
  .pb-icon svg {
    width: 17px;
    height: 17px;
  }
  .pb-icon-count {
    font-size: 0.62rem;
    font-weight: 700;
  }
  .pb-expand svg {
    width: 12px;
    height: 12px;
    transition: transform 0.16s ease;
  }
  .pb-expand.rotated svg {
    transform: rotate(180deg);
  }

  /* ── owner controls ─────────────────────────────────────────────────────── */
  .pb-mine-bar {
    padding: 0.5rem 0.9rem 0.7rem;
    border-top: 1px dashed rgba(238, 232, 170, 0.28);
    background: rgba(238, 232, 170, 0.05);
  }

  /* ── expanded panel ─────────────────────────────────────────────────────── */
  .pb-panel {
    border-top: 1px solid var(--pb-border);
    background: rgba(2, 6, 23, 0.35);
    padding: 0.85rem 0.9rem 1rem;
  }
  .pb-panel-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .pb-panel-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  .pb-panel-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pb-gold);
  }
  .pb-panel-empty {
    margin: 0;
    font-size: 0.78rem;
    color: var(--pb-text-3);
  }
  .pb-panel-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .pb-panel-link {
    font-size: 0.78rem;
    color: var(--pb-text-2);
    text-decoration: underline;
  }
  .pb-panel-link:hover {
    color: var(--pb-gold);
  }

  .pb-acts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
  .pb-act {
    display: grid;
    grid-template-columns: minmax(6rem, 1fr) minmax(0, 1.4fr) 5rem 2.6rem;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    text-align: start;
    padding: 0.4rem 0.6rem;
    border-radius: 10px;
    border: 1px solid var(--pb-border);
    background: rgba(15, 23, 42, 0.5);
    color: var(--pb-text-2);
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
  }
  .pb-act:hover {
    border-color: rgba(238, 232, 170, 0.45);
    background: rgba(30, 41, 59, 0.65);
  }
  .pb-act-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pb-text);
  }
  .pb-act-des {
    font-size: 0.72rem;
    color: var(--pb-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pb-act-bar {
    height: 6px;
    border-radius: 9999px;
    background: rgba(2, 6, 23, 0.7);
    overflow: hidden;
  }
  .pb-act-fill {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, rgba(238, 232, 170, 0.85), rgba(255, 0, 146, 0.85));
  }
  .pb-act-pct {
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  /* ── wide screens: the rows line up as columns and the labels drop out ───── */
  @media (min-width: 900px) {
    .pb-colheads,
    .pb-grid {
      display: grid;
      grid-template-columns:
        minmax(11rem, 2.3fr) minmax(7rem, 1fr) minmax(6.5rem, 1.1fr)
        minmax(6.5rem, 1fr) minmax(6rem, 1fr) minmax(6rem, 1.1fr) auto;
      gap: 0.75rem;
      align-items: center;
    }
    .pb-grid.no-equity,
    .pb-colheads.no-equity {
      grid-template-columns:
        minmax(11rem, 2.3fr) minmax(7rem, 1fr) minmax(6.5rem, 1.1fr)
        minmax(6.5rem, 1fr) minmax(6rem, 1.1fr) auto;
    }
    .pb-colheads {
      padding: 0 0.9rem 0.25rem;
      font-size: 0.66rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--pb-text-3);
    }
    .pb-col-end {
      text-align: end;
    }
    .pb-cell-label {
      display: none;
    }
    .pb-cell-actions {
      justify-content: flex-end;
    }
    .pb-panel-grid {
      grid-template-columns: 1.4fr 1fr;
    }
  }

  /* The create-task dialog keeps the shell it always had. */
  :global([data-svelte-dialog-content].formi) {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    width: 90vw;
    border-radius: 16px;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].formi) {
      width: 55vw;
    }
  }
</style>
