<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { t } from '$lib/translations';
  import dayjs from 'dayjs';
  import { nowId, addMes, initialForum } from '$lib/stores/pendMisMes.js';
  import { forumStore } from '$lib/stores/forumStore';
  /**
   * @typedef {Object} ComponentProps
   * @property {function({ani: string, coinlapach: any}): void} [onLess] - Callback for less event
   * @property {function({id: string}): void} [onHover] - Callback for hover event
   * @property {function({id: number}): void} [onMesima] - Callback for mesima event
   * @property {function({id: any}): void} [onProj] - Callback for proj event
   * @property {boolean} [isVisible] - Visibility flag
   * @property {boolean} [low] - Low flag
   * @property {boolean} [alreadyi] - Already flag
   * @property {string} [timeToP] - Time to profit
   * @property {number} [hst] - HST value
   * @property {number} [stb] - STB value
   * @property {any} coinlapach - Coinlapach data
   * @property {any} deadLine - Deadline date
   * @property {any} restime - Restime data
   * @property {any} deadLinefi - Deadline FI data
   * @property {any} projectName - Project name
   * @property {any} missionName - Mission name
   * @property {any} [role] - Role data
   * @property {any} [skills] - Skills data
   * @property {any} [acts] - Acts data
   * @property {any} missionDetails - Mission details
   * @property {string} [src] - Source URL
   * @property {any} projectId - Project ID
   * @property {string} [linki] - Link URL
   * @property {number} [oid] - OID value
   * @property {any} [workways] - Workways data
   * @property {number} [noOfHours] - Number of hours
   * @property {number} [perhour] - Per hour rate
   * @property {number} [stipendRate] - subsistence stipend the mission carries, ₪/hour
   * @property {number} [stipendCostShare] - α on that stipend
   * @property {string} [stipendMode] - equity | advance | gift
   * @property {string} [stipendFunderName] - the member funding it, when named
   * @property {number} [total] - Total value
   * @property {any} [askedarr] - Asked array
   * @property {any} [declineddarr] - Declined array
   * @property {any} hearotMeyuchadot - Hearot Meyuchadot data
   * @property {any} pid - PID value
   * @property {boolean} [cards] - Cards flag
   * @property {any} [chat] - Chat data
   * @property {any} askId - Ask ID
   * @property {string|null} [myRoundProposedBy] - latest round author on my application ('project' = rikma countered)
   * @property {number} [myOrdern] - latest round order on my application
   * @property {any[]} [myAskUsers] - my application's vots (for accept/counter)
   * @property {any} [myRound] - latest round terms on my application (my own counter-offer)
   * @property {any} order - Order data
   * @property {boolean} [selfNomination] - candidate-authored proposal (PLAN_SELF_NOMINATION)
   * @property {string|null} [wishName] - the customer's wish this is part of (concierge), or null
   * @property {boolean} [isMonthly] - recurring (paid per month) rather than one-off
   */
  /** @type {ComponentProps} */
  let {
    noOfusers,
    onLess,
    onHover,
    onMesima,
    onProj,
    isVisible = false,
    low = false,
    alreadyi = false,
    timeToP = 'more',
    hst = 187,
    stb = 180,
    coinlapach,
    deadLine,
    restime,
    deadLinefi,
    projectName,
    missionName,
    role = [],
    skills = [],
    acts = [],
    missionDetails,
    src = 'coin.png',
    projectId,
    linki = '/project/',
    oid = 0,
    workways = [],
    noOfHours = 0,
    perhour = 0,
    // The stipend the mission was published with (PLAN_STIPEND §13) — passed
    // straight through to the card, which shows it next to (never instead of)
    // the mission's own value.
    stipendRate = 0,
    stipendCostShare = 1,
    stipendMode = 'equity',
    stipendFunderName = '',
    total = 0,
    askedarr = [],
    declineddarr = [],
    hearotMeyuchadot,
    pid,
    cards = false,
    chat = [],
    askId,
    forumId, // Add forumId to props
    // Path B2 — the rikma's latest response on the candidate's own application.
    myRoundProposedBy = null, // 'project' → rikma countered, awaiting candidate
    myOrdern = 0,
    myAskUsers = [],
    myRound = null, // latest round terms on my application (my own counter-offer)
    order = {},
    onModal,
    selfNomination = false,
    // Project-less sources (PLAN_HUB_LEV_DEMAND_SYNC r2): identity click goes
    // to the wish/maagad page; offerHref replaces the apply flow (maagad).
    sourceHref = null,
    offerHref = null,
    // Part of a customer's wish (concierge), not a rikma looking for a partner
    // (QA C-10): the card speaks of the wish, and says nothing about joining a
    // rikma or about when it turns a profit. null for every rikma suggestion.
    wishName = null,
    // A one-off job is not paid "per month" (QA C-10).
    isMonthly = true
  } = $props();
  let already = $state(false);
  let error1 = $state(null);

  function less(oid) {
    console.log('less');
    onLess?.({ ani: 'prsug', coinlapach: coinlapach });
  }

  // Withdraw my own self-nominated proposal (PLAN_SELF_NOMINATION §3.3):
  // archives my Ask AND the mission I authored, and tells the members.
  let withdrawing = $state(false);
  async function withdrawSelfNom() {
    if (withdrawing || !oid) return;
    withdrawing = true;
    try {
      const result = await executeAction('dismissSelfNomination', {
        side: 'mission',
        id: String(oid),
        mode: 'withdraw'
      });
      if (result.success) less(oid);
      else error1 = result.error;
    } catch (e) {
      error1 = e;
    } finally {
      withdrawing = false;
    }
  }

  async function agree(oid) {
    already = true;
    try {
      /** @type {Record<string, unknown>} */
      const actionParams = {
        openMissionId: String(oid),
        existingAskedIds: askedarr.map(String)
      };
      // Only pass projectId when it exists — concierge open missions have no project
      // and the action detects that case via the missing projectId.
      if (projectId) {
        actionParams.projectId = String(projectId);
      }
      const result = await executeAction('applyToMission', actionParams);
      if (result.success) {
        askedarr.push(`${oid}`);
        less(oid);
      } else {
        error1 = result.error;
      }
    } catch (e) {
      error1 = e;
    }
  }

  let negoOpen = $state(false);
  let negoLoading = $state(false);

  function nego(openMissionId) {
    negoOpen = true;
    isOpen = true;
  }

  // Nego dialog submit. Two cases:
  //  - rikma already countered my application (B2) → candidateCounterOnAsk (new
  //    candidate round on my existing Ask, cancels the clock),
  //  - otherwise → proposeOnOpenMission (the action checks membership server-side
  //    and routes: member → Path D / project round; non-member → Path B / candidate).
  async function handleNegoSubmit({ newValues, originalValues }) {
    let action, params;
    if (myRoundProposedBy === 'project') {
      action = 'candidateCounterOnAsk';
      params = {
        askId: String(askId),
        openMissionId: String(oid),
        projectId: String(projectId),
        ordern: myOrdern ?? 0,
        newValues,
        users: myAskUsers ?? []
      };
    } else {
      action = 'proposeOnOpenMission';
      params = {
        openMissionId: String(oid),
        // A mission a wish published to the community has no rikma: leave the key out
        // (String(undefined) would send the word "undefined" as a project id).
        ...(projectId ? { projectId: String(projectId) } : {}),
        newValues,
        originalValues
      };
    }
    const result = await executeAction(action, params);
    if (!result.success) throw new Error(result.error?.message || `${action} failed`);
    already = true;
    askedarr.push(String(oid));
    less(oid);
  }

  // B2 — candidate accepts the rikma's counter: records the taker's favorable vote
  // at the latest round and (re)starts the auto-approval clock.
  async function acceptCounter() {
    already = true;
    try {
      const result = await executeAction('acceptCounterOnAsk', {
        askId: String(askId),
        projectId: String(projectId),
        ordern: myOrdern ?? 0,
        users: myAskUsers ?? []
      });
      if (result.success) less(oid);
      else error1 = result.error;
    } catch (e) {
      error1 = e;
    }
  }

  function afterNego() {
    negoOpen = false;
    negoLoading = false;
    isOpen = false;
  }

  async function decline(oid) {
    already = true;
    try {
      const result = await executeAction('declineOpenMission', {
        openMissionId: String(oid),
        existingDeclinedIds: declineddarr.map(String)
      });
      if (result.success) {
        declineddarr.push(`${oid}`);
        less(oid);
      } else {
        error1 = result.error;
      }
    } catch (e) {
      error1 = e;
    }
  }
  //out:fly={{duration: 2200, opacity: 0.5, y: 450}}


  let u = '';
  const restingHint = () =>
    wishName != null ? $t('lev.suggestor.wishSuggestion') : $t('lev.suggestor.joinSuggestion');
  function hover(id) {
    if (id == '0') {
      u = restingHint();
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }
  let pclim = $state(0);

  function mesima() {
    console.log('jjj');
    pclim += 1;
    setTimeout(function () {
      pclim = 0;
    }, 6000);
    if (pclim >= 2) {
      onMesima?.({ id: oid });
    }
  }

  function project() {
    // Wish/maagad-sourced needs have no rikma dialog — go to the source page.
    if (sourceHref) {
      goto(sourceHref);
      return;
    }
    onProj?.({ id: projectId });
  }
  onMount(function () {
    // Localization is now handled by the processor utility
  });
  function hoverc(event) {
    if (event == '0') {
      u = restingHint();
    } else {
      u = event;
    }
    onHover?.({ id: u });
  }
  import Cards from './cards/sugestmi.svelte';
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import Diun from './diun.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import NegoM from '../prPr/negoM.svelte';
  let isOpen = $state(false),
    diunm = $state(false),
    loading = false;
  const close = () => {
    isOpen = false;
    diunm = false;
    negoOpen = false;
    negoLoading = false;
  };

  let clicked = $state(false);
  // dataib removed

  let miDatan = [];
  async function afreact(event) {
    let why = event.why;
    console.log(why);

    // loading = true;

    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    let idL = cookieValueId;

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionKey: 'sendAskMessage',
          params: {
            askId: askId,
            content: why
          }
        })
      });

      const result = await response.json();
      console.log(result);

      if (result.success && result.data) {
        const {
          messageId,
          forumId: resForumId,
          content,
          createdAt
        } = result.data;

        // Update forumStore
        let picLink =
          'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
        if (
          typeof localStorage !== 'undefined' &&
          localStorage.getItem('picLink')
        ) {
          try {
            picLink = JSON.parse(localStorage.getItem('picLink'));
          } catch (e) {}
        }

        forumStore.addMessage(resForumId.toString(), {
          id: messageId,
          message: content,
          username: page.data.un || 'You',
          pic: picLink,
          timestamp: createdAt,
          sentByMe: true,
          pending: false
        });

        // Update legacy store using addMes
        addMes(
          content,
          resForumId,
          false, // pending
          true, // sentByMe
          picLink,
          createdAt,
          messageId,
          page.data.un || 'You'
        );

        clicked = false;
        // loading = false;
      } else {
        console.error('Failed to send message', result.error);
        // Fallback or error handling
      }
    } catch (e) {
      let error1 = e;
      console.log(error1);
    }
  }
  function tochat() {
    console.log('opening chat', forumId);
    if (forumId) {
      forumStore.initForum(forumId.toString(), page.data.id);
    }
    isOpen = true;
    diunm = true;
  }
  let dialogOpen = $state(false);
  function modal() {
    onModal?.();
    dialogOpen = true;
  }
  </script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly={{ y: 40, opacity: 0, duration: 250 }}>
    <DialogContent class="nego-modal surface-dialog" aria-label="form">
      <button class="nego-modal-close" onclick={close} aria-label="סגירה"
        >✕</button
      >
      {#if loading === true}
        <Spinner size="lg" />
      {:else if negoOpen === true}
        <NegoM
          onLoad={() => (negoLoading = true)}
          onClose={afterNego}
          onSubmit={handleNegoSubmit}
          descrip={missionDetails}
          {projectName}
          name1={missionName}
          {hearotMeyuchadot}
          noofhours={noOfHours}
          {perhour}
          {projectId}
          total={noOfHours * perhour}
          noofusers={noOfusers}
          pendId={String(oid)}
          {skills}
          tafkidims={role}
          {workways}
          mdate={deadLine}
          mdates={deadLinefi}
          isKavua={false}
          users={[]}
          isAsk={1}
        />
      {:else if diunm === true}
        <Diun
          onRect={afreact}
          smalldes={projectName + '-' + missionName}
          nameChatPartner={wishName != null
            ? $t('lev.suggestor.chatOnWish')
            : `${$t('lev.suggestor.chatOnJoining')} ${projectName}`}
          mypos={true}
          rect={true}
          {clicked}
          pendId={forumId ? forumId : oid}
          profilePicChatPartner={src.length > 0
            ? src
            : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
          ani={forumId ? 'new-forum' : 'iaskedMi'}
          messages={forumId ? $forumStore[forumId]?.messages || [] : []}
          isLoading={forumId ? $forumStore[forumId]?.loading || false : false}
        />
      {/if}
    </DialogContent>
  </div>
</DialogOverlay>
<Cards
  onProject={project}
  onAgree={() => agree(oid)}
  onDecline={() => decline(oid)}
  onNego={() => nego(oid)}
  onAccept={() => acceptCounter()}
  {myRoundProposedBy}
  {myRound}
  onHover={hoverc}
  onTochat={tochat}
  {isVisible}
  {noOfusers}
  {acts}
  {low}
  {hearotMeyuchadot}
  {alreadyi}
  {missionName}
  {noOfHours}
  {perhour}
  {stipendRate}
  {stipendCostShare}
  {stipendMode}
  {stipendFunderName}
  {already}
  {missionDetails}
  {skills}
  {role}
  {projectName}
  {src}
  {workways}
  {timeToP}
  {isMonthly}
  {wishName}
  {projectId}
  {selfNomination}
  onWithdraw={withdrawSelfNom}
  {offerHref}
/>

<style>
  /*  .normSmlHover{
        text-shadow: 1px 1px var(--gold);
        color: var(--barbi-pink);
        min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    }*/

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 9000;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global([data-svelte-dialog-content].nego-modal) {
    position: relative;
    border: 1px solid rgba(255, 0, 174, 0.35);
    border-radius: 1.25rem;
    width: min(700px, 96vw);
    max-height: 90vh;
    overflow-y: auto;
    padding: 2.5rem 1.5rem 2rem;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
    z-index: 9001;
  }
  .nego-modal-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    font-size: 1.25rem;
    color: var(--barbi-pink);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    z-index: 1;
    padding: 0.25rem 0.5rem;
    border-radius: 50%;
    transition: background 0.15s;
  }
  .nego-modal-close:hover {
    background: rgba(255, 0, 174, 0.15);
  }
</style>
