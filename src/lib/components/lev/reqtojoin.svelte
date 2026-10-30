<script>
  import { goto } from '$app/navigation';

  import dayjs from 'dayjs';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';

  import { fly } from 'svelte/transition';
  /**
   * @typedef {Object} Props
   * @property {boolean} [isVisible]
   * @property {boolean} [low]
   * @property {any} iskvua
   * @property {boolean} [modal]
   * @property {any} email
   * @property {any} coinlapach
   * @property {any} deadline
   * @property {any} projectName
   * @property {any} openmissionName
   * @property {any} [role]
   * @property {any} skills
   * @property {any} useraplyname
   * @property {string} [src]
   * @property {string} [src2]
   * @property {any} projectId
   * @property {string} [link]
   * @property {string} [linkU]
   * @property {any} userId
   * @property {any} [myid] viewer id — tells the taker's side from the rikma's
   * @property {string} [missionDetails]
   * @property {any} name
   * @property {number} [noofpu]
   * @property {any} publicklinks
   * @property {any} privatlinks
   * @property {any} hearotMeyuchadot
   * @property {number} [nhours]
   * @property {number} [valph]
   * @property {any} missId
   * @property {any} id
   * @property {any} openMid
   * @property {number} [st]
   * @property {any} pid
   * @property {any} [declined]
   * @property {any} noofusersWaiting
   * @property {any} uids
   * @property {any} what
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {boolean} [already]
   * @property {string} [stylef]
   * @property {any} askId
   * @property {any} users
   * @property {any} chat
   * @property {boolean} [mypose]
   * @property {number} [order]
   * @property {any} sqedualed
   * @property {any} timegramaId
   * @property {any} [timegramaDate]
   * @property {boolean} [timegramaDone]
   * @property {boolean} [cards]
   * @property {any} [onUser]
   * @property {any} [onProj]
   * Both receive `{ ani, coinlapach, finalized }`. `finalized` says whether the
   * request itself is over (accepted/declined for good) or the vote merely moved
   * on — a recorded vote still waiting for other members, a counter round, or an
   * acceptance parked on the assignee's consent. A list view collapses the card
   * either way; a single-vote page must not announce "resolved" for the latter.
   * @property {any} [onAcsept]
   * @property {any} [onDecline]
   * @property {any} [onHover]
   * @property {any} [onModal]
   * @property {boolean} [selfNomination] - candidate-authored proposal (PLAN_SELF_NOMINATION)
   */

  /** @type {Props} */
  let {
    onUser,
    onProj,
    onAcsept,
    onDecline,
    onHover,
    onModal,
    isVisible = false,
    low = false,
    iskvua,
    modal = $bindable(false),
    email,
    coinlapach,
    deadline,
    projectName,
    openmissionName,
    role = [],
    skills,
    useraplyname,
    src = 'coin.png',
    src2 = ' ',
    projectId,
    link = '/project/',
    linkU = '/user/',
    userId,
    missionDetails = '',
    name,
    noofpu = 0,
    publicklinks,
    privatlinks,
    hearotMeyuchadot,
    nhours = 0,
    valph = 0,
    missId,
    id,
    openMid,
    st = 0,
    pid,
    declined = [],
    noofusersWaiting,
    uids,
    what,
    noofusersOk,
    noofusersNo,
    already = false,
    stylef = '',
    askId,
    forumId, // Add forumId here
    users,
    chat,
    mypose = false,
    order = 0,
    orderon = 0,
    sqedualed,
    timegramaId,
    timegramaDate = null,
    timegramaDone = false,
    cards = false,
    isRishon = false,
    myid = null,
    workways = [],
    userSkills,
    userRole,
    userWorkway,
    negopendmissions = [],
    acts = [],
    selfNomination = false
  } = $props();

  // Full dismiss of a self-nominated proposal (PLAN_SELF_NOMINATION §3.3):
  // archives the Ask, cancels the timegrama and archives the OpenMission itself.
  let dismissing = $state(false);
  async function dismissSelfNom() {
    if (dismissing || !openMid) return;
    dismissing = true;
    try {
      const result = await executeAction('dismissSelfNomination', {
        side: 'mission',
        id: String(openMid)
      });
      if (result.success) {
        onDecline?.({ ani: 'asked', coinlapach, finalized: true });
      }
    } finally {
      dismissing = false;
    }
  }
  let resP = [];

  // Negotiation state management using Svelte 5 $state runes
  let negotiationMode = $state(false);
  let negotiationLoading = $state(false);
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  let ok;
  let nook;
  let tryo = $state('115%');
  let tryot = $state('-10.5%');
  let tryoti = $state('-5.25%');
  let nut;
  function xyz() {
    ok = percentage(noofusersOk, noofpu);
    nook = percentage(noofusersNo, noofpu);
    nut = percentage(noofusersWaiting, noofpu);

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

  let pmcli = $state(0);

  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }


  let error1;

  $effect(() => {
    console.log('noofusersOk', noofusersOk, openMid);
  });
  async function agree() {
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    const tafkidimsa = role.data.map((c) => c.id);
    // Snapshot before push so action can correctly detect new-member status
    const existingMemberIdsBefore = [...pid];

    if (!pid.includes(userId)) {
      pid.push(userId);
      pid = pid;
    }

    if (noofpu === 1) {
      try {
        const result = await executeAction('finalizeJoinAcceptance', {
          variant: 'solo',
          projectId,
          missId,
          openMid,
          askId,
          acceptedUserId: userId,
          acceptedUserName: useraplyname,
          openmissionName,
          missionDetails,
          nhours,
          valph,
          iskvua,
          privatlinks,
          publicklinks,
          hearotMeyuchadot,
          tafkidims: tafkidimsa,
          sqedualed,
          deadline,
          timegramaId,
          existingMemberIds: existingMemberIdsBefore,
          existingVotes: users,
          projectName,
          projectSrc: src2
        });
        if (result.success) {
          // `materialized: false` = the bilateral gate parked the acceptance on
          // the assignee's answer; nothing was registered yet.
          // The rikma said yes; a part of a customer's deal also waits for her (C-19).
          if (result.data?.pending === 'clientConsent') toast.info($t('lev.cards.awaitingClient'));
          onAcsept?.({
            ani: 'asked',
            coinlapach: coinlapach,
            finalized: result.data?.materialized !== false
          });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    } else if (noofpu === noofusersOk) {
      try {
        const result = await executeAction('finalizeJoinAcceptance', {
          variant: 'allVoted',
          projectId,
          missId,
          openMid,
          askId,
          acceptedUserId: userId,
          acceptedUserName: useraplyname,
          openmissionName,
          missionDetails,
          nhours,
          valph,
          iskvua,
          privatlinks,
          publicklinks,
          hearotMeyuchadot,
          tafkidims: tafkidimsa,
          sqedualed,
          deadline,
          timegramaId,
          existingMemberIds: existingMemberIdsBefore,
          existingVotes: users,
          projectName,
          projectSrc: src2
        });
        if (result.success) {
          // `materialized: false` = the bilateral gate parked the acceptance on
          // the assignee's answer; nothing was registered yet.
          // The rikma said yes; a part of a customer's deal also waits for her (C-19).
          if (result.data?.pending === 'clientConsent') toast.info($t('lev.cards.awaitingClient'));
          onAcsept?.({
            ani: 'asked',
            coinlapach: coinlapach,
            finalized: result.data?.materialized !== false
          });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    } else {
      try {
        const voteParams = {
          type: 'ask',
          id: askId,
          projectId: projectId,
          existingComponentData: users
        };
        const result = await executeAction('addVote', voteParams);
        if (result.success) {
          // Vote recorded only — the other members still have to answer.
          onAcsept?.({ ani: 'asked', coinlapach: coinlapach, finalized: false });
          // Phase 1 shadow signing — best-effort.
          shadowSignFromCookie(addVoteConsentSpec, voteParams);
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    }
  }
  function ask() {
    console.log('nego');
    // plain text? list? terms???
  }

  // Negotiation mode toggle function
  function toggleNegotiationMode() {
    negotiationMode = !negotiationMode;
    if (negotiationMode) {
      already = true;
      masa = true;
      isOpen = true;
    }
  }

  // The checklist currently on the table: the latest round's list when that
  // round carries one, else the offer's baseline. Seeding the nego dialog from
  // it is what keeps a counter-of-a-counter from silently dropping tasks the
  // other side added.
  const negotiatedActs = $derived(
    // Same rule the server applies at acceptance: the latest round that
    // recorded a checklist wins; rounds that said nothing about it fall
    // through to the offer's baseline.
    (negopendmissions ?? []).find((r) => r.attributes?.acts?.data?.length > 0)?.attributes
      ?.acts ?? acts
  );

  // Am I the one this Ask is about (the candidate / the assignee of an
  // isRishon offer)? Then my counter is the taker's side of the negotiation,
  // not the rikma's — it must open a `candidate` round so the rikma has to
  // respond before anything matures.
  const iAmTaker = $derived(
    myid != null && userId != null && String(myid) === String(userId)
  );

  // Rights-holder intermediate proposal on a candidate's Ask. Stored as a
  // Negopendmission round (proposedBy=project) — never overwriting the shared
  // OpenMission. Assigned offers (isRishon) run through the very same Ask
  // rounds: they have no pendm of their own, so the internal pendm flow would
  // have written to a foreign entity.
  async function handleCounter({
    newValues,
    originalValues,
    newActs = [],
    existingActsIds = [],
    actsChanged = false
  }) {
    const result = await executeAction('counterOnAsk', {
      askId: String(askId),
      openMissionId: openMid != null ? String(openMid) : undefined,
      projectId: String(projectId),
      ordern: orderon ?? 0,
      candidateUserId: userId != null ? String(userId) : undefined,
      newValues,
      newActs,
      existingActsIds,
      actsChanged,
      users
    });
    if (!result.success) throw new Error(String(result.error ?? 'counterOnAsk failed'));
  }

  // The taker's own counter — a `candidate` round at ordern+1 that hands the
  // turn back to the rikma (and stops the auto-approval clock).
  async function handleCandidateCounter({
    newValues,
    newActs = [],
    existingActsIds = [],
    actsChanged = false
  }) {
    const result = await executeAction('candidateCounterOnAsk', {
      askId: String(askId),
      openMissionId: openMid != null ? String(openMid) : undefined,
      projectId: String(projectId),
      ordern: orderon ?? 0,
      newValues,
      newActs,
      existingActsIds,
      actsChanged,
      users
    });
    if (!result.success) throw new Error(String(result.error ?? 'candidateCounterOnAsk failed'));
  }

  async function decline() {
    already = true;
    noofusersNo += 1;
    noofusersWaiting -= 1;
    ser = xyz();

    if (noofpu === 1) {
      try {
        const result = await executeAction('declineMissionRequest', {
          openMissionId: String(openMid),
          projectId: String(projectId),
          declinedUserId: String(userId)
        });
        if (result.success) {
          onDecline?.({ ani: 'asked', coinlapach, finalized: true });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
      }
    } else if (noofpu > 1) {
      // TODO: multi-voter decline
    }
  }

  let u = ' הצבעה על בקשה לביצוע משימה והצטרפות לרקמה';
  function hover(id) {
    if (id == '0') {
      u = ' הצבעה על בקשה לביצוע משימה והצטרפות לרקמה';
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }
  function hoverc(event) {
    if (event == '0') {
      u = ' הצבעה על בקשה לביצוע משימה והצטרפות לרקמה';
    } else {
      u = event;
    }
    onHover?.({ id: u });
  }
  let clicked = $state(false);
  async function react() {
    allr = true;
    isOpen = true;
    if (forumId) {
      forumStore.initForum(forumId.toString(), page.data.id);
    }
  }
  async function afreact(event) {
    if (chat !== null) {
      // const diu = objToString(chat);
    }
    let why = event.why;
    console.log(why);
    let d = new Date();
    //  loading = true;

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

        clicked = false;
        // loading = false;
      } else {
        console.error('Failed to send message', result.error);
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }
  import Card from './cards/reqtojoin.svelte';
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { forumStore } from '$lib/stores/forumStore';
  import Diun from './diun.svelte';
  import {
    nowId,
    addMes,
    pendMisMes,
    initialForum
  } from '$lib/stores/pendMisMes.js';
  import { executeAction } from '$lib/client/actionClient';
  import { shadowSignFromCookie } from '$lib/client/shadowSign';
  import { addVoteConsentSpec } from '$lib/consent/specs/addVote';
  import NegoM from '../prPr/negoM.svelte';
  import { getProjectData } from '$lib/stores/projectStore.js';
  import { page } from '$app/state';

  function tochat() {
    console.log('forumId', forumId);
    if (forumId) {
      forumStore.initForum(forumId.toString(), page.data.id);
    }
    isOpen = true;
    diunm = true;
  }
  let isOpen = $state(false),
    loading = $state(false),
    diunm = $state(false),
    masa = $state(false);
  const close = () => {
    isOpen = false;
    diunm = false;
    // Reset already to false when closing negotiation panel without saving
    if (negotiationMode && !negotiationLoading) {
      already = false;
    }
    masa = false;
    negotiationMode = false;
  };
  function afternego(event) {
    isOpen = false;
    negotiationLoading = false;
    masa = false;
    negotiationMode = false;
    // Only call onAcsept if negotiation was successful (saved).
    // A counter round keeps the request alive — the other side has to answer.
    onAcsept?.({
      ani: 'asked',
      coinlapach,
      finalized: false
    });
  }

</script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
    {#if masa === true}
      <DialogContent aria-label="form" class="nego d surface-dialog">
        <div dir="rtl" class="grid items-center justify-center text-center">
          {#if loading === true}
            <Spinner size="lg" />
          {:else}
            <NegoM
              masaalr={false}
              onLoad={() => (negotiationLoading = true)}
              onClose={afternego}
              onSubmit={iAmTaker ? handleCandidateCounter : handleCounter}
              candidateRound={negopendmissions?.find(
                (r) => r.attributes?.proposedBy === 'candidate'
              )?.attributes ?? null}
              {timegramaId}
              {negopendmissions}
              descrip={missionDetails}
              {projectName}
              name1={openmissionName}
              {hearotMeyuchadot}
              noofhours={nhours}
              perhour={valph}
              {projectId}
              total={nhours * valph}
              ordern={orderon}
              noofusers={noofpu}
              missionId={missId}
              {skills}
              isAsk={askId ?? 1}
              tafkidims={role}
              {workways}
              mdate={sqedualed}
              mdates={deadline}
              {iskvua}
              {publicklinks}
              {privatlinks}
              restime={getProjectData(projectId, 'restime')}
              pendId={null}
              bridgeSourceId={openMid}
              {users}
              acts={negotiatedActs}
            />
          {/if}
        </div>
      </DialogContent>
    {:else if diunm === true}
      <DialogContent class="chat d surface-dialog" aria-label="form">
        <div dir="rtl" class="grid items-center justify-center aling-center">
          {#if loading === true}
            <Spinner size="lg" />
          {/if}
          <Diun
            onRect={afreact}
            smalldes={projectName + '-' + openmissionName}
            nameChatPartner={`${$t('lev.reqtojoin.chatWith')} ${useraplyname} ${$t('lev.reqtojoin.onJoining')}`}
            mypos={true}
            {clicked}
            pendId={forumId}
            rect={true}
            profilePicChatPartner={src.length > 0
              ? src
              : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
            ani={forumId ? 'new-forum' : 'pendM'}
            messages={forumId ? $forumStore[forumId]?.messages || [] : []}
            isLoading={forumId ? $forumStore[forumId]?.loading || false : false}
          />
        </div>
      </DialogContent>
    {/if}
  </div>
</DialogOverlay>
<Card
  onAgree={() => agree()}
  onNego={toggleNegotiationMode}
  onHover={hoverc}
  onChat={tochat}
  onUser={() => onUser?.({ id: userId })}
  onProj={() => onProj?.({ id: projectId })}
  {isVisible}
  {projectId}
  {sqedualed}
  {hearotMeyuchadot}
  dates={deadline}
  {low}
  {already}
  {users}
  {projectName}
  {src}
  {noofusersWaiting}
  {useraplyname}
  {noofusersOk}
  {src2}
  noofhours={nhours}
  perhour={valph}
  {openmissionName}
  {iskvua}
  {isRishon}
  {missionDetails}
  {noofusersNo}
  {skills}
  {role}
  {workways}
  {userSkills}
  {userRole}
  {userWorkway}
  {negotiationMode}
  {negopendmissions}
  {orderon}
  acts={negotiatedActs}
  {selfNomination}
  onDismiss={dismissSelfNom}
/>

<style>

</style>
