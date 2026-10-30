<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { htmlExcerpt } from '$lib/text/htmlExcerpt';
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  const baseUrl = import.meta.env.VITE_URL;

  let token;
  let uId;

  function less() {
    onLess?.({
      ani: 'mashsu',
      coinlapach: coinlapach
    });
  }
  let miData = [];
  let error1 = null;

  function projectNav() {
    // Wish/maagad-sourced needs have no rikma dialog — go to the source page.
    if (sourceHref) {
      goto(sourceHref);
      return;
    }
    onProj?.({ id: projectId });
  }

  async function agree(oid) {
    already = true;
    const ds = declineddarra;
    ds.push(`${id}`);
    try {
      const result = await executeAction('createMashaabimRequest', {
        openMashaabimId: String(id),
        projectId: String(projectId),
        spId: String(oid),
        missionName: mashName != null ? String(mashName) : undefined
      });
      if (result.success) {
        less();
      } else {
        error1 = result.error;
      }
    } catch (e) {
      error1 = e;
    }
  }

  // Open the negotiation dialog so the candidate can offer parallel (counter) terms.
  function nego(oid) {
    masa = true;
    isOpen = true;
  }

  // Nego dialog submit. Two cases:
  //  - rikma already countered my application (B2) → candidateCounterOnAskm,
  //  - otherwise → proposeOnOpenMashaabim (the action checks membership server-side
  //    and routes: member → Path D / project round; non-member → Path B / candidate).
  async function handleNegoSubmit({ newValues }) {
    let action, params;
    if (myRoundProposedBy === 'project') {
      action = 'candidateCounterOnAskm';
      params = {
        askmId: String(askId),
        openMashaabimId: String(id),
        projectId: String(projectId),
        ordern: myOrdern ?? 0,
        newValues,
        users: myAskUsers ?? []
      };
    } else {
      action = 'proposeOnOpenMashaabim';
      params = {
        openMashaabimId: String(id),
        projectId: String(projectId),
        spId: String(oid),
        missionName: mashName != null ? String(mashName) : undefined,
        newValues
      };
    }
    const result = await executeAction(action, params);
    if (!result.success) {
      throw new Error(result.error || `${action} failed`);
    }
  }

  // B2 — candidate accepts the rikma's counter on a resource.
  async function acceptCounter() {
    already = true;
    try {
      const result = await executeAction('acceptCounterOnAskm', {
        askmId: String(askId),
        projectId: String(projectId),
        ordern: myOrdern ?? 0,
        users: myAskUsers ?? []
      });
      if (result.success) less();
      else error1 = result.error;
    } catch (e) {
      error1 = e;
    }
  }

  // Called by Nego after a successful submit (or on cancel): close + drop the card.
  function afternego() {
    masa = false;
    isOpen = false;
    loading = false;
    already = true;
    less();
  }

  async function decline(oid) {
    already = true;
    const ds = declineddarra;
    ds.push(`${oid}`);
    try {
      const result = await executeAction('declineSpForMashaabim', {
        spId: String(oid),
        openMashaabimId: String(id),
        projectId: String(projectId)
      });
      if (result.success) {
        less();
      } else {
        error1 = result.error;
      }
    } catch (e) {
      error1 = e;
    }
  }
  //out:fly={{duration: 2200, opacity: 0.5, y: 450}}


  let w = $derived(0);
  let u = 'הצעה לשיתוף משאב והצטרפות לרקמה';

  function hover(id) {
    if (id == '0') {
      u = 'הצעה לשיתוף משאב והצטרפות לרקמה';
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }

  function hoverc(event) {
    if (event.x == '0') {
      u = 'הצעה לשיתוף משאב והצטרפות לרקמה';
    } else {
      u = event.x;
    }
    onHover?.({ id: u });
  }
  import Cards from './cards/sugestma.svelte';
  import Nego from '../prPr/negoPend.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import Spinner from '$lib/celim/Spinner.svelte';
  import Diun from './diun.svelte';
  import { nowId } from '$lib/stores/pendMisMes.js';
  import { page } from '$app/state';
  function claf(event) {
    let o = event.alr;
    let d = event.y;
    console.log(o, d);
  }
  function tochat() {
    isOpen = true;
    diunm = true;
  }
  let clicked = $state(false);
  /**
   * @typedef {Object} Props
   * @property {boolean} [isVisible]
   * @property {boolean} [modal]
   * @property {any} coinlapach
   * @property {boolean} [low]
   * @property {any} [messege]
   * @property {boolean} [shows]
   * @property {any} kindOf
   * @property {any} deadLine
   * @property {any} sqedualedf
   * @property {any} [sqadualedf] - end date (recurring expense window end)
   * @property {boolean} [recurring] - recurring monthly/yearly expense
   * @property {number} [cycleSize] - every N months/years
   * @property {any} projectName
   * @property {any} mashName
   * @property {any} descrip
   * @property {any} src
   * @property {any} projectId
   * @property {string} [linki]
   * @property {number} [oid]
   * @property {string} [spnot]
   * @property {number} [easy]
   * @property {number} [price]
   * @property {number} [myp]
   * @property {number} [total]
   * @property {any} [askedarr]
   * @property {any} [declineddarra]
   * @property {any} id
   * @property {any} i
   * @property {any} restime
   * @property {boolean} [already]
   * @property {boolean} [cards]
   * @property {any} [chat]
   * @property {number} [order]
   * @property {number} [askId]
   * @property {string|null} [myRoundProposedBy]
   * @property {number} [myOrdern]
   * @property {any[]} [myAskUsers]
   * @property {any} [myRound]
   * @property {boolean} [selfNomination] - candidate-authored proposal (PLAN_SELF_NOMINATION)
   * @property {import('$lib/resources/dateMatchView.js').DateMatch | null} [dateMatch] - date-overlap line (PLAN_RESOURCE_CALENDAR §6.4)
   */

  /** @type {Props} */
  let {
    isVisible = false,
    modal = $bindable(false),
    coinlapach,
    low = false,
    messege = [],
    shows = true,
    kindOf,
    deadLine,
    sqedualedf,
    sqadualedf,
    recurring = false,
    cycleSize = 1,
    projectName,
    mashName,
    descrip,
    src,
    projectId,
    linki = '/project/',
    oid = 0,
    spnot = '',
    easy = 0,
    price = 0,
    myp = 0,
    total = 0,
    askedarr = [],
    declineddarra = [],
    id,
    i,
    restime,
    already = $bindable(false),
    cards = false,
    chat = $bindable([]),
    order = $bindable(0),
    askId = 1,
    // Path B2 — the rikma's latest response on the candidate's own application.
    myRoundProposedBy = null, // 'project' → rikma countered, awaiting candidate
    myOrdern = 0,
    myAskUsers = [],
    myRound = null, // latest round terms on my application (my own counter-offer)
    onLess,
    onProj,
    onHover,
    onModal,
    selfNomination = false,
    // Project-less sources (PLAN_HUB_LEV_DEMAND_SYNC r2): identity click goes
    // to the wish/maagad page; offerHref replaces the Askm flow buttons.
    sourceHref = null,
    offerHref = null,
    // The date-overlap line (PLAN_RESOURCE_CALENDAR §6.4). Null when the
    // holder's window already covers the request.
    /** @type {import('$lib/resources/dateMatchView.js').DateMatch | null} */
    dateMatch = null
  } = $props();

  // Withdraw my own self-nominated resource offer (PLAN_SELF_NOMINATION §3.3):
  // archives my Askm AND the OpenMashaabim I authored, and tells the members.
  let withdrawing = $state(false);
  async function withdrawSelfNom() {
    if (withdrawing || !id) return;
    withdrawing = true;
    try {
      const result = await executeAction('dismissSelfNomination', {
        side: 'resource',
        id: String(id),
        mode: 'withdraw'
      });
      if (result.success) less();
      else error1 = result.error;
    } catch (e) {
      error1 = e;
    } finally {
      withdrawing = false;
    }
  }
  let isOpen = $state(false),
    diunm = $state(false),
    masa = $state(false),
    loading = $state(false);
  const close = () => {
    isOpen = false;
    diunm = false;
    masa = false;
    loading = false;
  };
  let miDatan = [];
  async function afreact(event) {
    let why = event.why;
    try {
      const result = await executeAction('addAskmChatEntry', {
        askId: String(askId),
        why: String(why)
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
  <div transition:fly={{ y: 40, opacity: 0, duration: 250 }}>
    <DialogContent class="{masa === true && loading !== true ? 'nego-shell' : 'nego-modal'} surface-dialog" aria-label="form">
      {#if !(masa === true && loading !== true)}
        <button class="nego-modal-close" onclick={close} aria-label={$t('common.close')}
          >✕</button
        >
      {/if}
      {#if loading === true}
        <Spinner size="lg" />
      {:else if masa === true}
        <Nego
          framed
          onDismiss={close}
          onLoad={() => (loading = true)}
          onClose={afternego}
          onSubmit={handleNegoSubmit}
          masaalr={false}
          {descrip}
          {projectName}
          name1={mashName}
          {spnot}
          {kindOf}
          hm={0}
          {projectId}
          {total}
          noofusers={1}
          {price}
          {easy}
          linkto={''}
          pendId={null}
          bridgeSourceId={id}
          sqadualedf={sqedualedf}
          sqadualed={null}
          users={[]}
          ordern={0}
          {restime}
        />
      {:else if diunm === true}
        <Diun
          onRect={afreact}
          smalldes={projectName + '-' + mashName}
          nameChatPartner={`${$t('lev.mashsuggest.chatOnJoining')} ${projectName}`}
          mypos={true}
          rect={true}
          {clicked}
          pendId={askId}
          profilePicChatPartner={src.length > 0
            ? src
            : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
          ani="iaskedMa"
        />
      {/if}
    </DialogContent>
  </div>
</DialogOverlay>
<Cards
  onAgree={() => agree(oid)}
  onDecline={() => decline(oid)}
  onNego={() => nego(oid)}
  onAccept={() => acceptCounter()}
  {myRoundProposedBy}
  {myRound}
  onHover={hoverc}
  onTochat={tochat}
  {isVisible}
  {low}
  {mashName}
  {easy}
  {myp}
  {already}
  {deadLine}
  {sqedualedf}
  {sqadualedf}
  {kindOf}
  {recurring}
  {cycleSize}
  {price}
  {total}
  {descrip}
  {projectName}
  {projectId}
  {src}
  {spnot}
  {selfNomination}
  {dateMatch}
  onNegoDates={() => nego(oid)}
  onWithdraw={withdrawSelfNom}
  {offerHref}
  onProj={projectNav}
/>

<style>

  /*
    .normSmlHover{
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
        background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
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
