<script>
  /**
   * Focused, deep-linkable view of a single vote. Supports four kinds:
   *   - pmash → pending resource proposal   (PendingMa / pmas)
   *   - pendm → pending mission proposal    (PendingM / pandingMesima)
   *   - ask   → candidate join request      (Reqtojoin)
   *   - askm  → candidate/self resource join (Reqtom)
   *
   * Reuses the exact lev pipeline AND its shared stores so that:
   *   - the card's optimistic vote is reflected immediately (buttons hide,
   *     can't double-vote) — pmash/pendm write the store, ask/askm mutate their
   *     own bindable props, and
   *   - socket vote events from other members refetch + reseed this page.
   *
   * `buble` is DERIVED from the matching processed* store (not a one-shot
   * snapshot), which is what makes the optimistic update land here too.
   *
   * Self-contained on purpose: a future standalone /vote/[kind]/[id] outside
   * moach can render this component as-is, passing the same props.
   */
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { socketClient } from '$lib/stores/socketClient';
  import { projects } from '$lib/stores/projectStore.js';
  import {
    pendsStore,
    pmashesStore,
    askedStore,
    askedResourcesStore,
    halukasStore,
    decisionsStore,
    projectsStore
  } from '$lib/stores/levStores';
  import {
    processedPends,
    processedPmashes,
    processedAsked,
    processedAskedResources,
    processedHalukas,
    processedDecisions
  } from '$lib/stores/levDerived';
  import {
    extractProjects,
    extractPends,
    extractPmashes,
    extractAsked,
    extractAskedResources,
    extractHalukas,
    extractDecisions
  } from '$lib/utils/levDataExtractors';
  import PendingM from '$lib/components/lev/pandingMesima.svelte';
  import PendingMa from '$lib/components/lev/pmas.svelte';
  import Reqtojoin from '$lib/components/lev/reqtojoin.svelte';
  import Reqtom from '$lib/components/lev/reqtom.svelte';
  import Halukaask from '$lib/components/lev/halukaask.svelte';
  import DecisionMaking from '$lib/components/lev/decisionMaking.svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let { kind, entity, projectId, projectBase, uid, backHref } = $props();

  // Detail page is always interactive (never the dimmed "low" coin variant).
  const low = false;
  const VOTE_TYPES = ['pendmVote', 'pmashVote', 'maapVote', 'decisionVote', 'voteUpdate'];

  // Per-kind wiring. Keep these maps the single source of truth so adding a
  // future vote type is one entry each.
  const QID_MAP = {
    pmash: 'getPmashForVote',
    pendm: 'getPendmForVote',
    ask: 'getAskForVote',
    askm: 'getAskmForVote',
    tosplit: 'getTosplitForVote',
    decision: '159getDecisionForVote'
  };
  const ROOT_MAP = { pmash: 'pmash', pendm: 'pendm', ask: 'ask', askm: 'askm', tosplit: 'tosplit', decision: 'decision' };
  const COLLECTION_MAP = { pmash: 'pmashes', pendm: 'pendms', ask: 'asks', askm: 'askms', tosplit: 'tosplits', decision: 'decisions' };
  // Field on the processed item that carries the entity id (so the buble lookup
  // can match this vote): missions/resources expose `pendId`, asks expose `askId`.
  const MATCH_KEY = { pmash: 'pendId', pendm: 'pendId', ask: 'askId', askm: 'askId', tosplit: 'pendId', decision: 'pendId' };

  // Derived from props so SPA navigation between votes (same route, new params)
  // re-resolves them instead of keeping the first vote's values.
  let entityId = $derived(String(entity?.id ?? ''));
  let QID = $derived(QID_MAP[kind]);
  let ROOT = $derived(ROOT_MAP[kind]);

  let mounted = $state(false);
  // Terminal state is keyed to the entity id so navigating to another vote
  // (same component instance) clears it automatically — no effect assignment.
  let closedFor = $state(null);
  let closed = $derived(closedFor != null && closedFor === entityId);

  function upsertById(arr, item) {
    const others = (arr || []).filter((x) => String(x.id) !== String(item.id));
    return item ? [...others, item] : others;
  }

  // Build the lev-shaped wrapper from one entity, seed the shared stores the
  // pipeline + card helpers read, and upsert this item. Re-runnable: a socket
  // refetch passes a fresh entity here.
  function seedFromEntity(ent) {
    if (!ent) return;
    const collectionKey = COLLECTION_MAP[kind];
    const userData = {
      id: String(uid),
      attributes: {
        projects_1s: {
          data: [
            {
              id: String(projectId),
              attributes: {
                ...projectBase,
                [collectionKey]: { data: [ent] }
              }
            }
          ]
        }
      }
    };

    const projectsData = extractProjects(userData);
    // projectStore.js writable — read by createUserInfo/getProjectUsers/…
    projects.update((cur) => [
      ...(cur || []).filter((p) => String(p.id) !== String(projectId)),
      ...projectsData
    ]);
    // levStores projectsStore — second arg of the processed* derived stores.
    projectsStore.update((cur) => [
      ...(cur || []).filter((p) => String(p.id) !== String(projectId)),
      ...projectsData
    ]);

    if (kind === 'pmash') {
      const [item] = extractPmashes(userData);
      pmashesStore.update((cur) => upsertById(cur, item));
    } else if (kind === 'pendm') {
      const [item] = extractPends(userData);
      pendsStore.update((cur) => upsertById(cur, item));
    } else if (kind === 'ask') {
      const [item] = extractAsked(userData);
      askedStore.update((cur) => upsertById(cur, item));
    } else if (kind === 'askm') {
      const [item] = extractAskedResources(userData);
      askedResourcesStore.update((cur) => upsertById(cur, item));
    } else if (kind === 'tosplit') {
      const [item] = extractHalukas(userData);
      if (item) halukasStore.update((cur) => upsertById(cur, item));
    } else if (kind === 'decision') {
      const [item] = extractDecisions(userData);
      if (item) decisionsStore.update((cur) => upsertById(cur, item));
    }
  }

  // Re-fetch this single entity (other member voted / negotiated / consensus).
  // A null result means it was archived → terminal state.
  async function refetch() {
    try {
      const res = await sendToSer({ eid: entityId }, QID, null, null, false, fetch);
      const ent = res?.data?.[ROOT]?.data ?? null;
      if (!ent) {
        closedFor = entityId;
        return;
      }
      seedFromEntity(ent);
    } catch (e) {
      console.error('[VoteDetail] refetch failed', e);
    }
  }

  // The card writes its optimistic vote into pmashesStore/pendsStore, so reading
  // the processed store here makes that update show up immediately.
  let buble = $derived.by(() => {
    const list =
      kind === 'pmash'
        ? $processedPmashes
        : kind === 'pendm'
          ? $processedPends
          : kind === 'ask'
            ? $processedAsked
            : kind === 'tosplit'
              ? $processedHalukas
              : kind === 'decision'
                ? $processedDecisions
                : $processedAskedResources;
    const key = MATCH_KEY[kind];
    return list.find((b) => String(b[key]) === entityId) ?? null;
  });

  // (Re)seed whenever the target entity changes — covers the initial load and
  // SPA navigation between vote pages without a remount. Reset the terminal
  // state so a freshly opened vote isn't shown as closed.
  $effect(() => {
    void entity;
    seedFromEntity(entity);
  });

  let socketUnsub;
  onMount(() => {
    mounted = true;
    socketUnsub = socketClient.onNotification((n) => {
      const type = n?.metadata?.type || n?.data?.type;
      const np = n?.actionParams?.projectId || n?.data?.projectId;
      if (
        np &&
        String(np) === String(projectId) &&
        type &&
        VOTE_TYPES.includes(type)
      ) {
        refetch();
      }
    });
  });
  onDestroy(() => socketUnsub?.());

  // Consensus / full-NO archive: the card bubbles this up. On a standalone page
  // there is no list to collapse into — flip to a terminal state.
  const onCoinLapach = () => {
    closedFor = entityId;
  };
  // ask/askm cards (Reqtojoin/Reqtom) emit onAcsept/onDecline when the request is
  // finalized (consensus accept or full decline). On a standalone page there is
  // no list to collapse into → flip to the same terminal state as pmash/pendm.
  const onResolved = () => {
    closedFor = entityId;
  };
  const hover = () => {};
  const proj = () => goto(`/moach/${projectId}`);
  const user = (e) => {
    const id = e?.id;
    if (id) goto(`/user/${id}`);
  };
  const noop = () => {};

  const i18n = {
    he: { back: '→ לכל ההצבעות בריקמה', closed: 'ההצבעה הוכרעה — תודה על ההשתתפות!', missing: 'הפריט לא נמצא או כבר הועבר לארכיון.' },
    en: { back: '→ All project votes', closed: 'This vote is resolved — thanks for taking part!', missing: 'This item was not found or has already been archived.' },
    ar: { back: '→ كل تصويتات المشروع', closed: 'تم حسم التصويت — شكراً لمشاركتك!', missing: 'العنصر غير موجود أو تمت أرشفته.' }
  };
  let t = $derived(i18n[$lang] || i18n.en);
</script>

<div class="vote-detail mx-auto max-w-xl px-3 py-4" dir={$isRtl ? 'rtl' : 'ltr'}>
  <a
    href={backHref}
    class="inline-block mb-4 text-sm text-blue-500 hover:underline"
  >
    {t.back}
  </a>

  {#if !browser || !mounted}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if closed}
    <div
      class="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center space-y-4"
    >
      <div class="text-4xl">✨</div>
      <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{t.closed}</p>
      <a
        href={backHref}
        class="inline-block px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl"
        >{t.back}</a
      >
    </div>
  {:else if !buble}
    <div
      class="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center text-gray-600 dark:text-gray-300"
    >
      {t.missing}
    </div>
  {:else if kind === 'pmash'}
    <div class="vote-card-wrap mx-auto">
      <PendingMa
        cards="true"
        {low}
        onHover={hover}
        onProj={proj}
        onUser={user}
        onCoinLapach={onCoinLapach}
        coinlapach={buble.coinlapach}
        restime={buble.restime}
        ordern={buble.orderon}
        timegramaId={buble.timegramaId}
        messege={buble.messege}
        mysrc={buble.mysrc}
        mypos={buble.mypos}
        diun={buble.diun}
        descrip={buble.descrip}
        projectName={buble.projectName}
        name={buble.name}
        hearotMeyuchadot={buble.hearotMeyuchadot}
        kindOf={buble.kindOf}
        src={buble.src}
        noofusersWaiting={buble.noofusersWaiting}
        projectId={buble.projectId}
        noofusersOk={buble.noofusersOk}
        created_at={buble.created_at}
        noofusersNo={buble.noofusersNo}
        already={buble.already}
        noofusers={buble.noofusers}
        mshaabId={buble.mshaabId}
        hm={buble.hm}
        price={buble.price}
        easy={buble.easy}
        sqadualed={buble.sqadualed}
        sqadualedf={buble.sqadualedf}
        recurring={buble.recurring}
        recurringNoEnd={buble.recurringNoEnd}
        pricePerUnit={buble.pricePerUnit}
        cycleSize={buble.cycleSize}
        linkto={buble.linkto}
        location={buble.location}
        pendId={buble.pendId}
        users={buble.users}
        nego_mashes={buble.nego_mashes || []}
        timeGramaDate={buble.timeGramaDate}
      />
    </div>
  {:else if kind === 'ask'}
    <div class="vote-card-wrap mx-auto">
      <Reqtojoin
        cards="true"
        {low}
        isVisible={true}
        onAcsept={onResolved}
        onDecline={onResolved}
        onHover={hover}
        onProj={proj}
        onUser={user}
        iskvua={buble.iskvua}
        email={buble.email}
        role={buble.role}
        workways={buble.workways}
        userSkills={buble.userSkills}
        userRole={buble.userRole}
        userWorkway={buble.userWorkway}
        skills={buble.skills}
        coinlapach={buble.coinlapach}
        pid={buble.pid}
        chat={buble.chat}
        noofusersWaiting={buble.noofusersWaiting}
        uids={buble.uids}
        what={buble.what}
        noofusersOk={buble.noofusersOk}
        noofusersNo={buble.noofusersNo}
        already={buble.already}
        users={buble.users}
        askId={buble.askId}
        projectName={buble.projectName}
        useraplyname={buble.username}
        userId={buble.uid}
        missionDetails={buble.missionDetails}
        src={buble.src}
        src2={buble.src2}
        openmissionName={buble.openName}
        name={buble.name}
        projectId={buble.projectId}
        noofpu={buble.noof}
        publicklinks={buble.publicklinks}
        privatlinks={buble.privatlinks}
        hearotMeyuchadot={buble.hearotMeyuchadot}
        valph={buble.perhour}
        nhours={buble.nhours}
        deadline={buble.deadline}
        sqedualed={buble.sqedualed}
        missId={buble.missId}
        id={buble.id}
        acts={buble.acts}
        openMid={buble.omid}
        stylef={buble.stylef}
        st={buble.st}
        isRishon={buble?.openMissionData?.isRishon || buble.isRishon}
        declined={buble.decid}
        timegramaId={buble.timegramaId}
        timegramaDate={buble.timegramaDate}
        timegramaDone={buble.timegramaDone}
        negopendmissions={buble.negopendmissions || []}
        orderon={buble.orderon || 0}
        forumId={buble.forumId}
      />
    </div>
  {:else if kind === 'askm'}
    <div class="vote-card-wrap mx-auto">
      <Reqtom
        cards="true"
        {low}
        isVisible={true}
        onAcsept={onResolved}
        onDecline={onResolved}
        onHover={hover}
        onProj={proj}
        onUser={user}
        onChat={noop}
        pid={buble.pid}
        coinlapach={buble.coinlapach}
        noofusersWaiting={buble.noofusersWaiting}
        uids={buble.uids}
        what={buble.what}
        noofusersOk={buble.noofusersOk}
        noofusersNo={buble.noofusersNo}
        already={buble.already}
        users={buble.users}
        askId={buble.askId}
        projectName={buble.projectName}
        useraplyname={buble.username}
        userId={buble.uid}
        missionDetails={buble.descrip}
        src={buble.src}
        src2={buble.src2}
        openmissionName={buble.openName}
        name={buble.name}
        projectId={buble.projectId}
        noofpu={buble.noof}
        myp={buble.myp}
        easy={buble.easy}
        spnot={buble.spnot}
        hearotMeyuchadot={buble.spnot}
        price={buble.price}
        deadline={buble.deadline}
        sqadualedf={buble.sqadualedf}
        kindOf={buble.kindOf}
        recurring={buble.recurring}
        cycleSize={buble.cycleSize}
        missId={buble.missId}
        id={buble.id}
        openMid={buble.omid}
        stylef={buble.stylef}
        st={buble.st}
        declined={buble.decid}
        spid={buble.spid}
        timegramaId={buble.timegramaId}
        timegramaDate={buble.timegramaDate}
        timegramaDone={buble.timegramaDone}
        pmashId={buble.pmashId}
        isRishon={buble.isSelfProposal === true}
        pendingMainVote={buble.pendingMainVote === true}
        negopendmissions={buble.negopendmissions || []}
        orderon={buble.orderon || 0}
      />
    </div>
  {:else if kind === 'tosplit'}
    <div class="vote-card-wrap mx-auto">
      <Halukaask
        cards="true"
        {low}
        isVisible={true}
        onCoinLapach={onCoinLapach}
        onProj={proj}
        onHover={hover}
        onModal={noop}
        pendId={buble.pendId}
        coinlapach={buble.coinlapach}
        name={buble.name}
        projectName={buble.projectName}
        src={buble.src}
        projectId={buble.projectId}
        halukot={buble.halukot}
        hervach={buble.hervach}
        siteShare={buble.siteShare}
        noofusers={buble.noofusers}
        noofusersOk={buble.noofusersOk}
        noofusersNo={buble.noofusersNo}
        noofusersWaiting={buble.noofusersWaiting}
        already={buble.already}
        users={buble.users}
      />
    </div>
  {:else if kind === 'decision'}
    <div class="vote-card-wrap mx-auto">
      <DecisionMaking
        cards={true}
        {low}
        isVisible={true}
        askId={buble.pendId}
        kind={buble.kind}
        projectId={buble.projectId}
        projectName={buble.projectName}
        src={buble.src}
        src2={buble.newpic || ''}
        newpicid={buble.newpicid}
        myid={uid}
        userId={uid}
        restime={buble.restime}
        timegramaDate={buble.timegramaDate}
        timegramaId={buble.timegramaId}
        noofusersOk={buble.noofusersOk}
        noofusersNo={buble.noofusersNo}
        noofusersWaiting={buble.noofusersWaiting}
        already={buble.already}
        users={buble.users}
        messege={buble.messege}
        coinlapach={buble.coinlapach}
        spdata={buble.spdata}
        onAcsept={onCoinLapach}
        onHover={hover}
        onProj={proj}
      />
    </div>
  {:else}
    <div class="vote-card-wrap mx-auto">
      <PendingM
        cards="true"
        {low}
        onHover={hover}
        onProj={proj}
        onUser={user}
        onCoinLapach={onCoinLapach}
        onModal={noop}
        timegramaId={buble.timegramaId}
        negopendmissions={buble.negopendmissions}
        createdAt={buble.createdAt}
        restime={buble.restime}
        timegramaDate={buble.timegramaDate}
        publicklinks={buble.publicklinks}
        privatlinks={buble.privatlinks}
        dates={buble.dates}
        ordern={buble.orderon}
        coinlapach={buble.coinlapach}
        messege={buble.messege}
        mysrc={buble.mysrc}
        mypos={buble.mypos}
        descrip={buble.descrip}
        projectName={buble.projectName}
        name={buble.name}
        hearotMeyuchadot={buble.hearotMeyuchadot}
        noofhours={buble.noofhours}
        src={buble.src}
        noofusersWaiting={buble.noofusersWaiting}
        projectId={buble.projectId}
        uids={buble.uids}
        what={buble.what}
        noofusersOk={buble.noofusersOk}
        total={buble.noofhours * buble.perhour}
        perhour={buble.perhour}
        noofusersNo={buble.noofusersNo}
        already={buble.already}
        noofusers={buble.noofusers}
        missionId={buble.missionId}
        skills={buble.skills}
        tafkidims={buble.tafkidims}
        workways={buble.workways}
        mdate={buble.mdate}
        mdates={buble.dates}
        vallues={buble.vallues}
        location={buble.location}
        pendId={buble.pendId}
        isKavua={buble.isKavua}
        diun={buble.diun}
        acts={buble.acts}
        users={buble.users}
        sqadualed={buble.sqadualed}
      />
    </div>
  {/if}
</div>

<style>
  /* Give the card a sensible focused width; the lev card view normally lives
     inside a swiper slide that constrains it. */
  .vote-card-wrap :global(.swiper-slidec),
  .vote-card-wrap {
    min-height: 60vh;
  }
</style>
