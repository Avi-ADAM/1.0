<script>
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import Nego from '../prPr/negoM.svelte';
  import LocationView from '$lib/components/location/LocationView.svelte';
  import { invalidate } from '$app/navigation';
  import { updatePendsStore } from '$lib/utils/levVotePatch';
  import { idPr } from '../../stores/idPr.js';
  import Diun from './diun.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  /**
   * @typedef {Object} Props
   * @property {any} coinlapach
   * @property {boolean} [isVisible]
   * @property {any} [mypos]
   * @property {boolean} [low]
   * @property {any} restime
   * @property {any} [negopendmissions]
   * @property {boolean} [modal]
   * @property {any} [messege]
   * @property {string} [descrip]
   * @property {string} [projectName]
   * @property {string} [name]
   * @property {string} [hearotMeyuchadot]
   * @property {number} [noofhours]
   * @property {string} [src]
   * @property {number} [perhour]
   * @property {any} projectId
   * @property {any} [uids]
   * @property {any} [what]
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} noofusersWaiting
   * @property {number} [total]
   * @property {any} noofusers
   * @property {boolean} [already]
   * @property {any} missionId
   * @property {any} [skills]
   * @property {any} [tafkidims]
   * @property {any} [workways]
   * @property {any} vallues
   * @property {any} publicklinks
   * @property {any} privatlinks
   * @property {any} mdate
   * @property {boolean} [isKavua]
   * @property {number} [howMeny] - how many people the mission needs (PLAN_SHIFTS §2)
   * @property {boolean} [isshift] - the proposal carries a staffing plan
   * @property {any} mdates
   * @property {any} timegramaDate
   * @property {any} timegramaId
   * @property {any} createdAt
   * @property {any} pendId
   * @property {any} users
   * @property {any} mysrc
   * @property {any} [diun]
   * @property {any} [order]
   * @property {number} [ordern]
   * @property {any} [location]
   * @property {boolean} [cards]
   * @property {(payload: { ani: string, coinlapach: any }) => void} [onCoinLapach]
   * @property {(payload: { id: any }) => void} [onProj]
   * @property {(payload: { id: string }) => void} [onHover]
   * @property {() => void} [onModal]
   */

  /** @type {Props} */
  let {
    coinlapach,
    isVisible = false,
    mypos = null,
    low = false,
    restime,
    negopendmissions = [],
    modal = $bindable(false),
    messege = [],
    descrip = '',
    projectName = '',
    name = '',
    hearotMeyuchadot = '',
    noofhours = 0,
    src = 'coin.png',
    perhour = 0,
    projectId,
    uids = [],
    what = [],
    noofusersOk,
    noofusersNo,
    noofusersWaiting,
    total = 0,
    noofusers,
    already = false,
    missionId,
    skills = [],
    tafkidims = [],
    workways = [],
    vallues,
    publicklinks,
    privatlinks,
    mdate,
    isKavua = false,
    howMeny = 1,
    isshift = false,
    mdates,
    timegramaDate,
    timegramaId,
    createdAt,
    pendId,
    users,
    acts,
    mysrc,
    sqadualed,
    dates,
    diun = [],
    order = diun.length,
    ordern = 0,
    location = null,
    cards = false,
    onCoinLapach,
    onProj,
    onHover,
    onModal
  } = $props();
  let error1;
  let no = $state(false);
  let masa = $state(false);
  let why = '';
  let isOpen = $state(false);
  let loading = $state(false);
  // Realtime chat forum for this mission vote (replaces the old `diun` store).
  let forumId = $state(null);
  let chatm = $state(false);
  $inspect(acts);
  onMount(() => {
    // Unwrap Strapi collection objects ({ data: [...] }) to plain arrays before localizing
    const skillsArr = Array.isArray(skills) ? skills : (skills?.data ?? []);
    const tafkidimsArr = Array.isArray(tafkidims) ? tafkidims : (tafkidims?.data ?? []);
    const workwaysArr = Array.isArray(workways) ? workways : (workways?.data ?? []);

    // oneLangAdj localizes the items; keep result as { data: [...] } for downstream components
    skills =
      oneLangAdj(
        {
          data: skillsArr
        },
        $lang,
        'skillName'
      );
    tafkidims =
      oneLangAdj(
        {
          data: tafkidimsArr
        },
        $lang,
        'roleDescription'
      );
    workways =
      oneLangAdj(
        {
          data: workwaysArr
        },
        $lang,
        'workWayName'
      );
  });

  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  let diunm = false;
  let ok;
  let nook;
  let nut;
  let tryo = $state('116%');
  let tryot = $state('-10.5%');
  let tryoti = $state('-5.25%');
  function xyz() {
    ok = percentage(noofusersOk, noofusers);
    nook = percentage(noofusersNo, noofusers);
    nut = percentage(noofusersWaiting, noofusers);
    let ser = [];
    ser.push({
      perc: ok,
      color: '#7EE081'
    });

    if (nut > 0) {
      ser.push({
        perc: nut,
        color: '#0000cc'
      });
    }
    if (nook > 0) {
      ser.push({
        perc: nook,
        color: '#80037e'
      });
    }
    if (nut > 0 && nook > 0) {
      tryo = '129%';
      tryot = '-17%';
      tryoti = '-11.5%';
    }

    ser = ser;
    return ser;
  }

  let ser = $state(xyz());

  // Recompute the progress ring whenever the vote counts change — these arrive
  // as props re-derived from the pends store, so the ring tracks the store
  // instead of relying on manual mutation that re-renders would overwrite.
  $effect(() => {
    // touch the reactive count props so the effect re-runs when they change
    void noofusersOk;
    void noofusersNo;
    void noofusersWaiting;
    ser = xyz();
  });

  function coinLapach() {
    onCoinLapach?.({
      ani: 'pendmi',
      coinlapach: coinlapach
    });
  }

  // Build the current user's vote in the Strapi-nested shape that processPends
  // (and the socket merge) expect, so an optimistic store update reads back
  // identically to the server echo.
  function buildMyVote(whatVal, whyText) {
    const myId = String(page.data.id);
    const vote = {
      what: Boolean(whatVal),
      users_permissions_user: { data: { id: myId } },
      order: ordern ?? 0,
      ide: parseInt(myId, 10),
      zman: new Date().toISOString()
    };
    if (whyText) vote.why = whyText;
    return vote;
  }

  // Apply a vote to the shared pends store immediately. mergeVote replaces the
  // caller's prior vote at the same order, so this is safe to call twice
  // (optimistic + authoritative echo) without double counting.
  function applyMyVote(vote, id = pendId) {
    updatePendsStore({ id: String(id), newVote: vote });
  }

  let allr = $state(false);
  let forceRect = $state(false);

  async function agree(alr) {
    // Immediate optimistic update to the shared store — this is the single
    // source of truth, so the vote sticks through re-renders, the buttons hide,
    // and the user can't vote twice while the request is in flight.
    applyMyVote(buildMyVote(true));

    try {
      const result = await executeAction('voteOnPendm', {
        pendId: String(pendId),
        projectId: String(projectId),
        what: true,
      });
      if (!result.success) {
        await invalidate(() => true); // roll back to server truth
        return;
      }
      if (result.data?.consensus) {
        coinLapach();
      } else if (result.data?.newVote) {
        // Reconcile with the authoritative vote (correct order/zman from server).
        applyMyVote(result.data.newVote, result.data.id ?? pendId);
      }
    } catch (e) {
      error1 = e;
      toast.warning($t('lev.pandingMesima.error'));
      await invalidate(() => true); // roll back the optimistic vote
    }
  }
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';

  async function tochat() {
    no = false;
    masa = false;
    diunm = true;
    loading = false;
    forceRect = true;
    chatm = true;
    isOpen = true;
    if (!forumId) {
      try {
        const result = await executeAction('ensureVoteForum', {
          entityType: 'pendm',
          entityId: String(pendId),
          projectId: String(projectId)
        });
        if (result.success) forumId = result.data?.forumId ?? null;
      } catch (e) {
        console.log(e);
      }
    }
    if (forumId) forumStore.initForum(String(forumId), page.data.id);
  }

  // Persist a chat message to the forum. The Diun component has already added an
  // optimistic (pending) bubble via forumStore; here we save it and reconcile
  // with the real message id. Other participants receive it over the socket.
  async function sendForumMessage(event) {
    const message = event?.why?.trim();
    if (!message || !forumId) return;
    try {
      const result = await executeAction('createChatMessage', {
        forumId: String(forumId),
        message
      });
      if (result.success && result.data) {
        let picLink =
          'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
        try {
          if (typeof localStorage !== 'undefined' && localStorage.getItem('picLink')) {
            picLink = JSON.parse(localStorage.getItem('picLink'));
          }
        } catch (e) {}
        forumStore.addMessage(String(forumId), {
          id: result.data.messageId,
          message,
          username: page.data.un || 'You',
          pic: picLink,
          timestamp: new Date().toISOString(),
          sentByMe: true,
          pending: false
        });
      }
    } catch (e) {
      console.log(e);
      toast.warning($t('lev.pandingMesima.error'));
    }
  }
  let masaalr = $state(false);
  async function nego(alr) {
    if (alr == 'alr') {
      allr = true;
      no = false;
      masa = true;
      isOpen = true;
      masaalr = true;
    } else {
      already = true;
      no = false;
      masa = true;
      isOpen = true;
      console.log(masa);
    }
  }

  function decline(alr) {
    if (alr == 'alr') {
      // Changing vote from YES → NO immediately (no dialog needed). afterwhy()
      // performs the optimistic store update + server call.
      allr = true;
      isOpen = false;
      afterwhy(); // fire without event (no why text)
    } else {
      // First-time NO vote: open dialog to enter reason
      already = true;
      no = true;
      diunm = true;
      isOpen = true;
    }
  }

  async function afterwhy(event) {
    const whyText = event?.why ?? '';
    loading = true;
    // Immediate optimistic update to the shared store (see agree()).
    applyMyVote(buildMyVote(false, whyText));

    try {
      const result = await executeAction('voteOnPendm', {
        pendId: String(pendId),
        projectId: String(projectId),
        what: false,
        ...(whyText ? { why: whyText } : {}),
      });
      loading = false;
      if (!result.success) {
        await invalidate(() => true); // roll back to server truth
        return;
      }
      // Close the reason dialog now that the vote is recorded.
      isOpen = false;
      no = false;
      if (result.data?.archived) {
        // Full NO consensus archived the pend — server already triggered a
        // full refresh; drop the bubble from this view too.
        coinLapach();
      } else if (result.data?.newVote) {
        // Reconcile with the authoritative vote.
        applyMyVote(result.data.newVote, result.data.id ?? pendId);
      }
    } catch (e) {
      error1 = e;
      loading = false;
      toast.warning($t('lev.pandingMesima.error'));
      await invalidate(() => true); // roll back the optimistic vote
    }
  }
  const close = () => {
    isOpen = false;
    if (no === true) {
      already = false;
    }
    // Reset already to false when closing negotiation panel without changes
    if (masa === true && !loading) {
      already = false;
    }
    no = false;
    masa = false;
    allr = false;
    forceRect = false;
    chatm = false;
  };

  function afternego(event) {
    isOpen = false;
    loading = false;
    no = false;
    masa = false;
    // The negotiated card is updated in place via the pends store (see negoM),
    // so keep the bubble — don't remove it — and the user sees the new terms
    // and reopened vote round without the view jumping back to the start.
  }
  let rect = false;
  async function react() {
    allr = true;
    rect = true;
    isOpen = true;
  }
  async function afreact(event) {
    why = event.why;
    const diunEntry = {
      what: mypos,
      users_permissions_user: page.data.id,
      why,
      order: (order += 1),
      zman: new Date().toISOString(),
      ide: page.data.id
    };

    try {
      const result = await executeAction('addDiunEntry', {
        entityType: 'pendm',
        entityId: String(pendId),
        projectId: String(projectId),
        what: mypos,
        why,
      });
      if (result.success) {
        const newDiunId = result.data?.newDiunId;
        if (newDiunId) nowId.set(newDiunId);
        diun.push(diunEntry);
        diun = diun;
        clicked = false;
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      toast.warning($t('lev.pandingMesima.error'));
    }
  }

  let clicked = $state(false);


  let u = 'הצבעה על פרסום הצעת משימה לרקמה';

  function hover(id) {
    if (id == '0') {
      u = 'הצבעה על פרסום הצעת משימה לרקמה';
    } else {
      u = id;
    }
    onHover?.({
      id: u
    });
  }

  function hoverc(event) {
    if (event.x == '0') {
      u = 'הצבעה על פרסום הצעת משימה לרקמה';
    } else {
      u = event.x;
    }
    onHover?.({
      id: u
    });
  }
  import Cards from './cards/pending.svelte';
  import { oneLangAdj } from '$lib/func/oneLangAdj.svelte';
  import { lang } from '$lib/stores/lang';
  import { t } from '$lib/translations';
  import { nowId } from '$lib/stores/pendMisMes';
  import { forumStore } from '$lib/stores/forumStore';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/state';
  import { executeAction } from '$lib/client/actionClient';

  function claf(event) {
    let o = event.alr;
    let d = event.y;
    if (d == 'a') {
      console.log('agree');
      agree(o);
    } else if (d == 'd') {
      decline(o);
    } else if (d == 'n') {
      nego(o);
    }
    console.log(o, d);
  }
</script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
    {#if masa === true}
      <DialogContent aria-label="form" class="nego d surface-dialog">
        <div dir="rtl" class="grid items-center justify-center text-center">
          <button
            style="margin: 0 auto;"
            onclick={close}
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title="ביטול"
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg></button
          >
          {#if loading === true}
            <Spinner size="lg" />
          {:else}
            <Nego
              {masaalr}
              {mypos}
              {acts}
              onLoad={() => (loading = true)}
              onClose={afternego}
              {timegramaId}
              {negopendmissions}
              {descrip}
              {projectName}
              name1={name}
              {hearotMeyuchadot}
              {noofhours}
              {perhour}
              {projectId}
              {total}
              {ordern}
              {noofusers}
              {missionId}
              {skills}
              {tafkidims}
              {workways}
              {mdate}
              {mdates}
              {isKavua}
              {howMeny}
              {isshift}
              {publicklinks}
              {privatlinks}
              {location}
              {restime}
              {pendId}
              {users}
            />
          {/if}
        </div>
      </DialogContent>
    {:else if chatm === true}
      <DialogContent aria-label="form" class="chat d surface-dialog">
        <div dir="rtl" class="grid items-center justify-center text-center">
          <button
            style="margin: 0 auto;"
            onclick={close}
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title="ביטול"
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg></button
          >
          <Diun
            onRect={sendForumMessage}
            bind:clicked
            rect={true}
            rikmaName={projectName}
            smalldes={name}
            nameChatPartner={`הצבעה על ${name}`}
            nameMe={page.data.un || 'Me'}
            {mypos}
            pendId={forumId}
            profilePicChatPartner={src}
            ani={forumId ? 'new-forum' : 'pendM'}
            messages={forumId ? $forumStore[forumId]?.messages || [] : []}
            isLoading={forumId ? $forumStore[forumId]?.loading || false : false}
          />
        </div>
      </DialogContent>
    {:else}
      <DialogContent aria-label="form" class="chat d surface-dialog">
        <div dir="rtl" class="grid items-center justify-center text-center">
          <button
            style="margin: 0 auto;"
            onclick={close}
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title="ביטול"
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg></button
          >
          {#if loading === true}
            <Spinner size="lg" />
          {:else}
            <Diun
              onRect={afreact}
              onNo={afterwhy}
              {no}
              bind:clicked
              rect={forceRect || (noofusersOk > 0 && noofusersNo > 0)}
              smalldes={projectName}
              nameChatPartner={`הצבעה על ${name}`}
              {mypos}
              profilePicChatPartner={src}
              messages={messege}
              {pendId}
              ani="pendM"
            />
          {/if}
        </div>
      </DialogContent>
    {/if}
  </div>
</DialogOverlay>
<Cards
  onAgree={claf}
  onDecline={claf}
  onHover={hoverc}
  onTochat={tochat}
  {acts}
  {skills}
  {sqadualed}
  {dates}
  {location}
  {timegramaDate}
  {tafkidims}
  {workways}
  {low}
  {isKavua}
  {howMeny}
  {isshift}
  {pendId}
  {noofhours}
  {perhour}
  {hearotMeyuchadot}
  {already}
  {projectName}
  {negopendmissions}
  {src}
  {noofusersWaiting}
  {noofusersOk}
  {name}
  {restime}
  {createdAt}
  {descrip}
  {mypos}
  {projectId}
  {users}
  activeOrder={ordern}
  {allr}
  {noofusersNo}
  onNego={claf}
/>

<style>

  :global([data-svelte-dialog-content].chat) {
    z-index: 1000;
    padding: 0px;
    margin: 0px;
    height: 70vh;
    aspect-ratio: 1/1.7;
    margin-top: 30vh;
    border-radius: 10%;
    overflow-y: auto;
  }

  :global([data-svelte-dialog-content].nego) {
    z-index: 1000;
    padding: 15px;
    margin: 0px;
    margin-right: 25px;

    height: 70vh;
    width: fit-content;
    margin-top: 30vh;
    border-radius: 5%;
    overflow-y: auto;
    border-top-right-radius: 2%;
    border-bottom-right-radius: 2%;
  }

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }

  @media (max-width: 450px) {
    :global([data-svelte-dialog-content].chat) {
      width: 80vw;
    }
  }

  @media (min-width: 600px) {
    :global([data-svelte-dialog-content].chat) {
      overflow-y: auto;
      z-index: 1000;
      padding: 0px;
      margin: 0px;
      height: 80vh;
      margin-top: 20vh;
      border-radius: 5%;
      width: auto !important;
    }

    :global([data-svelte-dialog-content].nego) {
      overflow: auto;

      z-index: 1000;
      padding: 15px;
      margin-right: 25px;
      margin: 0px;
      margin-top: 20vh;
      height: 80vh;
      max-width: 100vw;
      border-radius: 5%;
      border-top-right-radius: 2%;
      border-bottom-right-radius: 2%;
    }

    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
    }

  }
</style>
