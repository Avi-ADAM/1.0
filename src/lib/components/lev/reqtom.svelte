<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import Card from './cards/rektom.svelte';
  import { nowId } from '$lib/stores/pendMisMes';
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import Spinner from '$lib/celim/Spinner.svelte';
  import Diun from './diun.svelte';
  const baseUrl = import.meta.env.VITE_URL;
  let clicked = $state(false);
  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [modal]
   * @property {boolean} [isVisible]
   * @property {any} coinlapach
   * @property {any} deadline
   * @property {any} [timegramaId]
   * @property {any} [timegramaDate]
   * @property {boolean} [timegramaDone]
   * @property {any} [pmashId]
   * @property {any} [sqadualedf]
   * @property {any} [kindOf]
   * @property {boolean} [recurring]
   * @property {number} [cycleSize]
   * @property {any} projectName
   * @property {any} openmissionName
   * @property {any} myp
   * @property {any} easy
   * @property {any} price
   * @property {any} useraplyname
   * @property {string} [src]
   * @property {string} [src2]
   * @property {any} projectId
   * @property {string} [link]
   * @property {string} [linkU]
   * @property {any} userId
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
   * @property {any} [declined]
   * @property {any} noofusersWaiting
   * @property {any} uids
   * @property {any} what
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {boolean} [already]
   * @property {any} pid
   * @property {string} [stylef]
   * @property {any} askId
   * @property {any} users
   * @property {any} spid
   * @property {boolean} [cards]
   * @property {any} [chat]
   * @property {number} [order]
   * `finalized` says whether the request itself is over (accepted/declined for
   * good) or the vote merely moved on — a recorded vote still waiting for other
   * members, a counter round, or an acceptance parked on the candidate's
   * consent. A list view collapses the card either way; a single-vote page must
   * not announce "resolved" for the latter.
   * `what` is the recorded position when the payload is a plain vote.
   * @property {(payload: { ani: string, coinlapach: any, finalized?: boolean, what?: boolean }) => void} [onAcsept]
   * @property {(payload: { ani: string, coinlapach: any, finalized?: boolean, what?: boolean }) => void} [onDecline]
   * @property {(payload: { id: string }) => void} [onHover]
   * @property {() => void} [onModal]
   * @property {(payload: { id: any }) => void} [onUser]
   * @property {(payload: { id: any }) => void} [onProj]
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
    low = false,
    modal = $bindable(false),
    isVisible = false,
    coinlapach,
    deadline,
    sqadualedf,
    kindOf,
    recurring = false,
    cycleSize = 1,
    projectName,
    openmissionName,
    myp,
    easy,
    price,
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
    hearotMeyuchadot = '',
    spnot = '',
    nhours = 0,
    valph = 0,
    missId,
    id,
    openMid,
    st = 275,
    declined = [],
    noofusersWaiting = $bindable(),
    uids,
    what,
    noofusersOk = $bindable(),
    noofusersNo = $bindable(),
    already = $bindable(false),
    pid = $bindable(),
    stylef = '24px',
    askId,
    users,
    spid,
    cards = false,
    chat = $bindable([]),
    order = $bindable(0),
    // שדות חדשים למשא ומתן
    timegramaId,
    timegramaDate = null,     // מועד פקיעת ה-timegrama → שעון עצר לאישור אוטומטי
    timegramaDone = false,    // אם ה-timegrama כבר נסגר/בוטל → לא מציגים שעון
    isRishon = false,         // = isSelfProposal: חבר פרויקט שיצר ישירות → כותרת מיוחדת + מו"מ
    pmashId = undefined,      // pmash relation id — present on isSelfProposal Askms
    pendingMainVote = false,  // = הצבעה כפולה: גם על הצורך וגם שהחבר נותן אותו
    negopendmissions = [],
    orderon = 0,
    selfNomination = false,
  } = $props();
  let resP = [];

  // Full dismiss of a self-nominated resource offer (PLAN_SELF_NOMINATION §3.3):
  // archives the Askm, cancels the timegrama and archives the OpenMashaabim.
  let dismissing = $state(false);
  async function dismissSelfNom() {
    if (dismissing || !openMid) return;
    dismissing = true;
    try {
      const result = await executeAction('dismissSelfNomination', {
        side: 'resource',
        id: String(openMid)
      });
      if (result.success) {
        onDecline?.({ ani: 'askedma', coinlapach, finalized: true });
      }
    } finally {
      dismissing = false;
    }
  }

  // Negotiation state management
  let negotiationMode = $state(false);
  let negotiationLoading = $state(false);

  function toggleNegotiationMode() {
    negotiationMode = !negotiationMode;
    if (negotiationMode) {
      already = true;
      masa = true;
      isOpen = true;
    }
  }

  function afternego() {
    isOpen = false;
    negotiationLoading = false;
    masa = false;
    negotiationMode = false;
    // A counter round keeps the request alive — the other side has to answer.
    onAcsept?.({ ani: 'askedma', coinlapach, finalized: false });
  }

  // Rights-holder intermediate proposal on a candidate's Askm. Stored as a
  // NegoMash round (proposedBy=project) on the Askm — never overwriting the
  // shared OpenMashaabim. For self-proposals (isRishon) the internal pmash flow
  // is used instead, so onSubmit is only wired for the external-candidate case.
  async function handleCounter({ newValues }) {
    const result = await executeAction('counterOnAskm', {
      askmId: String(askId ?? id),
      openMashaabimId: openMid != null ? String(openMid) : undefined,
      projectId: String(projectId),
      ordern: orderon ?? 0,
      candidateUserId: userId != null ? String(userId) : undefined,
      newValues,
      users
    });
    if (!result.success) {
      throw new Error(result.error || 'counterOnAskm failed');
    }
  }

  import { executeAction } from '$lib/client/actionClient';
  import Nego from '../prPr/negoPend.svelte';
  import { getProjectData } from '$lib/stores/projectStore.js';


  let error1;
  let miDatan = [];

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

  import { idPr } from '$lib/stores/idPr.js';
  import { page } from '$app/state';

  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }
  async function agree() {
    const isFirst = noofusersOk === 0 && noofusersNo === 0;
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    const existingMemberIdsBefore = [...pid];

    if (!pid.includes(userId)) {
      pid.push(userId);
      pid = pid;
    }

    if (noofpu === 1 || noofpu === noofusersOk) {
      const variant = noofpu === 1 ? 'solo' : 'allVoted';
      try {
        const result = await executeAction('finalizeAskmAcceptance', {
          variant,
          openMashaabimId: openMid != null ? String(openMid) : undefined,
          isSelfProposal: isRishon,
          pmashId: pmashId != null ? String(pmashId) : undefined,
          askmId: String(askId),
          projectId: String(projectId),
          spId: String(spid),
          missionName: openmissionName,
          acceptedUserId: String(userId),
          existingMemberIds: existingMemberIdsBefore,
          existingVotes: users,
        });
        if (result.success) {
          // `materialized: false` = the bilateral gate parked the acceptance on
          // the candidate's answer; nothing was registered yet.
          // The rikma said yes; a part of a customer's deal also waits for her (C-19).
          if (result.data?.pending === 'clientConsent') toast.info($t('lev.cards.awaitingClient'));
          onAcsept?.({
            ani: 'askedma',
            coinlapach,
            finalized: result.data?.materialized !== false
          });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
      }
    } else {
      try {
        const result = await executeAction('finalizeAskmAcceptance', {
          variant: 'partial',
          askmId: String(askId),
          projectId: String(projectId),
          existingVotes: users,
          isFirstVote: isFirst,
        });
        if (result.success) {
          // Usually a vote only. But the server counts from the DB, not from
          // this card: if everyone else said yes since it loaded, this was the
          // last yes and the resource is now registered.
          onAcsept?.({ ani: 'askedma', coinlapach, finalized: result.data?.materialized === true });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
      }
    }
  }

  async function decline() {
    already = true;
    noofusersNo += 1;
    noofusersWaiting -= 1;
    ser = xyz();

    if (noofpu === 1) {
      try {
        const result = await executeAction('declineAskmRequest', {
          askmId: String(id),
          projectId: String(projectId),
          existingVotes: users,
        });
        if (result.success) {
          onDecline?.({ ani: 'askedma', coinlapach, finalized: true });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
      }
    } else if (noofpu > 1) {
      // More than one member: a single no does not archive anything. It is
      // recorded at the current negotiation round, where `computeNegoGate`
      // reads it as "not these terms" — it blocks the silence/auto-approval
      // path for round `orderon` and stops counting the moment either side
      // opens a new round.
      //
      // TODO (consent redesign): there should be no plain "not in favor" here
      // at all. Per the "no absolute no" principle, objecting is supposed to BE
      // a nego round — this button should open the negotiation panel
      // (toggleNegotiationMode → counterOnAskm) so the objection arrives with
      // the terms the objector would sign, and the only way to reject a
      // candidate outright should be accepting a different offer for the same
      // resource (which archives the sibling Askms on its own). See
      // src/lib/server/actions/configs/voteOnAskm.ts for the full note.
      try {
        const result = await executeAction('voteOnAskm', {
          askmId: String(askId ?? id),
          projectId: String(projectId),
          what: false,
          order: orderon ?? 0,
          existingVotes: users,
        });
        if (result.success) {
          // Recorded, not resolved: the request stays open for a counter round.
          onDecline?.({ ani: 'askedma', coinlapach, finalized: false, what: false });
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
      }
    }
  }

  function hover(id) {
    let ut;
    if (id == '0') {
      ut = $t('lev.reqtom.voteTitle');
    } else {
      ut = id;
    }
    onHover?.({ id: ut });
  }

  function hoverc(event) {
    let ut;
    if (event.x == '0') {
      ut = $t('lev.reqtom.voteTitle');
    } else {
      ut = event.x;
    }
    onHover?.({ id: ut });
  }
  function tochat() {
    isOpen = true;
    diunm = true;
  }

  let isOpen = $state(false),
    diunm = $state(false),
    masa = $state(false),
    loading = false;
  const close = () => {
    isOpen = false;
    diunm = false;
    // Reset negotiation state when closing without saving
    if (negotiationMode && !negotiationLoading) {
      already = false;
    }
    masa = false;
    negotiationMode = false;
  };
  async function afreact(event) {
    let why = event.why;
    try {
      const result = await executeAction('addAskmChatEntry', {
        askId: String(askId),
        why: String(why),
      });
      if (result.success) {
        chat = result.data.chat ?? chat;
        if (result.data.lastId) nowId.set(result.data.lastId);
        clicked = false;
      }
    } catch (e) {
      console.log(e);
    }
  }
</script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly={{ y: 450, opacity: 0.5, duration: 2000 }}>
    {#if masa === true}
      <DialogContent aria-label="form" class="{negotiationLoading ? 'nego' : 'nego-shell'} surface-dialog">
          {#if negotiationLoading}
            <div class="grid justify-center p-4"><Spinner size="lg" /></div>
          {:else}
            <Nego
              framed
              onDismiss={close}
              masaalr={false}
              onLoad={() => (negotiationLoading = true)}
              onClose={afternego}
              onSubmit={isRishon ? null : handleCounter}
              candidateRound={!isRishon ? (negopendmissions?.find(r => r.attributes?.proposedBy === 'candidate')?.attributes ?? null) : null}
              descrip={missionDetails}
              {projectName}
              name1={openmissionName}
              spnot={hearotMeyuchadot || spnot}
              price={myp || price}
              easy={easy || 0}
              hm={nhours || 0}
              {timegramaId}
              {projectId}
              total={myp || price}
              noofusers={noofpu}
              pendId={isRishon ? (pmashId ?? id) : id}
              linkto={''}
              sqadualed={deadline}
              {sqadualedf}
              {kindOf}
              {recurring}
              {cycleSize}
              {users}
              ordern={orderon}
              restime={getProjectData(projectId, 'restime')}
            />
          {/if}
      </DialogContent>
    {:else if diunm === true}
      <DialogContent class="chat surface-dialog" aria-label="form">
        <div dir="rtl" class="grid items-center justify-center aling-center">
          <button
            onclick={close}
            style="margin: 0 auto;"
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title={$t('lev.reqtom.cancel')}
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg></button
          >
          {#if loading === true}
            <Spinner size="lg" />
          {:else if diunm === true}
            <Diun
              onRect={afreact}
              smalldes={projectName + '-' + openmissionName}
              nameChatPartner={`${$t('lev.reqtom.chatOnJoining')} ${useraplyname}
   ${projectName} `}
              mypos={true}
              rect={true}
              {clicked}
              pendId={askId}
              profilePicChatPartner={src.length > 0
                ? src
                : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
              ani="askedMa"
            />
          {/if}
        </div>
      </DialogContent>
    {/if}
  </div>
</DialogOverlay>

<Card
  candidateId={userId}
  onTochat={tochat}
  onAgree={() => agree()}
  onDecline={() => decline()}
  onNego={toggleNegotiationMode}
  onHover={hoverc}
  {isVisible}
  {already}
  {users}
  {projectName}
  {projectId}
  {src}
  {low}
  {deadline}
  {sqadualedf}
  {kindOf}
  {recurring}
  {cycleSize}
  {easy}
  {myp}
  {price}
  {hearotMeyuchadot}
  {spnot}
  {noofusersWaiting}
  {useraplyname}
  {noofusersOk}
  {src2}
  {openmissionName}
  {missionDetails}
  {noofusersNo}
  {isRishon}
  {negotiationMode}
  {negopendmissions}
  {orderon}
  {selfNomination}
  onDismiss={dismissSelfNom}
/>

<style>

  /* ─── Dialog overlays ─── */
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  :global([data-svelte-dialog-content].nego) {
    z-index: 1000;
    padding: 10px;
    width: 80vw;
  }
  :global([data-svelte-dialog-content].chat) {
    z-index: 1000;
    padding: 0px;
    margin: 0px;
    height: 70vh;
    aspect-ratio: 1/1.7;
    margin-top: 30vh;
    border-radius: 10%;
  }
  @media (min-width: 600px) {
    :global([data-svelte-dialog-content].nego) {
      width: 50vw;
    }
    :global([data-svelte-dialog-content].chat) {
      height: 80vh;
      aspect-ratio: 1/2;
      margin-top: 20vh;
      border-radius: 15%;
    }
  }
</style>
