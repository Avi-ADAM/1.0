<script>
  /**
   * Focused, deep-linkable view of a single vote (pmash resource / pendm
   * mission). Reuses the exact lev pipeline AND its shared stores so that:
   *   - the card's own optimistic vote (updatePmashesStore/updatePendsStore)
   *     is reflected immediately (buttons hide, can't double-vote), and
   *   - socket vote events from other members refresh this page.
   *
   * `buble` is DERIVED from processedPmashes/processedPends (not a one-shot
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
  import { pendsStore, pmashesStore, projectsStore } from '$lib/stores/levStores';
  import { processedPends, processedPmashes } from '$lib/stores/levDerived';
  import {
    extractProjects,
    extractPends,
    extractPmashes
  } from '$lib/utils/levDataExtractors';
  import PendingM from '$lib/components/lev/pandingMesima.svelte';
  import PendingMa from '$lib/components/lev/pmas.svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let { kind, entity, projectId, projectBase, uid, backHref } = $props();

  // Detail page is always interactive (never the dimmed "low" coin variant).
  const low = false;
  const VOTE_TYPES = ['pendmVote', 'pmashVote', 'maapVote', 'decisionVote', 'voteUpdate'];

  // Derived from props so SPA navigation between votes (same route, new params)
  // re-resolves them instead of keeping the first vote's values.
  let entityId = $derived(String(entity?.id ?? ''));
  let QID = $derived(kind === 'pmash' ? 'getPmashForVote' : 'getPendmForVote');
  let ROOT = $derived(kind === 'pmash' ? 'pmash' : 'pendm');

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
    const collectionKey = kind === 'pmash' ? 'pmashes' : 'pendms';
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
    } else {
      const [item] = extractPends(userData);
      pendsStore.update((cur) => upsertById(cur, item));
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
    const list = kind === 'pmash' ? $processedPmashes : $processedPends;
    return list.find((b) => String(b.pendId) === entityId) ?? null;
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
