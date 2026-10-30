<script>
  import Money from '$lib/components/money/Money.svelte';
  import { t, isRtl } from '$lib/translations';
  import { get } from 'svelte/store';
  import { Portal } from 'bits-ui';
  import { executeAction } from '$lib/client/actionClient';
  import { shadowSignFromCookie } from '$lib/client/shadowSign';
  import { addVoteConsentSpec } from '$lib/consent/specs/addVote';
  import { proposalCounterConsentSpec } from '$lib/consent/specs/counterSaleClaim';
  import { toast } from 'svelte-sonner';
  import { lang } from '$lib/stores/lang.js';
  import Close from '../../celim/close.svelte';
  import { onMount } from 'svelte';

  // baseUrl removed — actions go through /api/action, not direct GraphQL
  /**
   * @typedef {Object} Props
   * @property {boolean} [isVisible]
   * @property {boolean} [low]
   * @property {any} kind
   * @property {any} messege
   * @property {any} myid
   * @property {any} userId
   * @property {any} spdata
   * @property {any} newpicid
   * @property {any} coinlapach
   * @property {any} deadline
   * @property {any} projectName
   * @property {any} openmissionName
   * @property {string} [src]
   * @property {string} [src2]
   * @property {any} projectId
   * @property {any} created_at
   * @property {string} [missionDetails]
   * @property {number} [noofpu]
   * @property {any} id
   * @property {any} openMid
   * @property {number} [st]
   * @property {any} [declined]
   * @property {any} noofusersWaiting
   * @property {any} uids
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {boolean} [already]
   * @property {any} pid
   * @property {string} [stylef]
   * @property {any} askId
   * @property {any} users
   * @property {any} timegramaDate
   * @property {any} restime
   * @property {any} timegramaId
   * @property {any} [saleClaim] - Bilateral saleClaim payload (holder/reporter, standing round, negom)
   * @property {{ requesterId: any, requesterName: string, sheirutName: string, sheirutDescrip: string } | null} [askwant] - kind 'askwants': who asks to receive which service
   * @property {boolean} [cards]
   * @property {number} [tx]
   * @property {boolean} [modal]
   * @property {(payload: { id: any }) => void} [onHover] - Callback for 'hover' event
   * @property {(payload: { id: any }) => void} [onProj] - Callback for 'proj' event
   * @property {(payload: { id: string }) => void} [onModal] - Callback for 'modal' event
   * @property {(payload: { id: string }) => void} [onUser] - Callback for 'user' event
   * @property {(payload: { id: string }) => void} [onChat] - Callback for 'chat' event
   * @property {(payload: { id: string }) => void} [onAcsept] - Callback for 'acsept' event
   */

  /** @type {Props} */
  let {
    isVisible = false,
    low = false,
    kind,
    messege,
    myid,
    userId,
    spdata,
    newpicid,
    coinlapach,
    deadline,
    projectName,
    openmissionName = $bindable(),
    src = 'coin.png',
    src2 = ' ',
    projectId,
    created_at,
    missionDetails = '',
    noofpu = 0,
    id,
    openMid,
    st = $bindable(205),
    declined = [],
    noofusersWaiting = $bindable(),
    uids,
    noofusersOk = $bindable(),
    noofusersNo = $bindable(),
    already = $bindable(false),
    pid,
    stylef = '24px',
    askId,
    users,
    timegramaDate,
    restime,
    timegramaId,
    cards = false,
    tx = 200,
    saleClaim = null,
    askwant = null,
    modal = $bindable(false),
    onModal,
    onHover,
    onProj,
    onAcsept,
    onUser,
    onChat
  } = $props();
  let decisionCurrentValue = $state('');
  let decisionNewValue = $state('');
  let decisionLook = $state(null);
  let decisionPreviewHref = $state('');

  onMount(async () => {
    console.log('HACHLATA!!!');
    st = 115;
    if (kind === 'pic') {
      openmissionName = $t('lev.decision.logoVoteShort');
    } else if (kind === 'saleClaim') {
      const pn = saleClaim?.productName ? ` (${saleClaim.productName})` : '';
      openmissionName = $t('lev.decision.saleConsent', { suffix: pn });
      // Prefill the negotiation form with the version currently on the table.
      nqty = saleClaim?.standing?.hm ?? saleClaim?.current?.unit ?? 1;
      nprice = saleClaim?.standing?.price ?? 0;
    } else if (kind === 'sheirutpends') {
      openmissionName = $t('lev.decision.newServiceVote');
    } else if (kind === 'askwants') {
      // Not a Decision row — getDecisionDetails would look the askwant id up
      // as a decision id.
      openmissionName = askwant?.sheirutName || $t('lev.decision.askwantVote');
    } else if (askId && projectId) {
      // Fetch current vs. proposed values for all other decision kinds
      try {
        const result = await executeAction('getDecisionDetails', {
          decisionId: String(askId),
          projectId: String(projectId),
        });
        if (result.success && result.data) {
          const { fieldLabel, currentValue, newValue } = result.data;
          if (fieldLabel) {
            openmissionName = fieldLabel;
          }
          decisionCurrentValue = currentValue ?? '';
          decisionNewValue = newValue ?? '';
          // PLAN_RIKMA_SUBDOMAINS: the rikma's address / public look.
          if (kind === 'address' || kind === 'look') {
            openmissionName = $t(`rikmaLook.card.${kind}Title`);
            decisionLook = result.data.look ?? null;
            decisionPreviewHref = result.data.previewHref ?? '';
          }
        }
      } catch (e) {
        console.warn('getDecisionDetails failed:', e);
      }
    }
  });


  let error1;

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

  async function agree() {
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();

    try {
      if (kind === 'sheirutpends') {
        // Use existing sheirutpend vote action — handles consensus → createSheirut internally
        const voteParams = {
          type: 'sheirutpend',
          id: String(askId),
          projectId: String(projectId),
        };
        const result = await executeAction('addVote', voteParams);
        if (result.success) {
          onAcsept?.({ ani: 'askedma', coinlapach });
          // Phase 1 shadow signing — best-effort.
          shadowSignFromCookie(addVoteConsentSpec, voteParams);
        } else {
          error1 = result.error;
        }
      } else if (kind === 'askwants') {
        // A request to receive a service (D2): one member's yes lets the rest's
        // silence settle it; every member's yes settles it now (server-side).
        const result = await executeAction('addVote', {
          type: 'askwant',
          id: String(askId),
          projectId: String(projectId),
        });
        if (result.success) {
          if (result.data?.approved) onAcsept?.({ ani: 'askedma', coinlapach });
        } else {
          error1 = result.error;
          toast.error($t('lev.decision.askwantVoteFailed'));
        }
      } else {
        // Decision vote (pic, etc.) — server-authoritative consensus check
        const result = await executeAction('voteOnDecision', {
          decisionId: String(askId),
          projectId: String(projectId),
          kind: String(kind),
          ...(newpicid != null ? { newpicid: String(newpicid) } : {}),
          ...(timegramaId != null ? { timegramaId: String(timegramaId) } : {}),
        });
        if (result.success) {
          // Phase 1 shadow signing for the standing-round agreement.
          if (kind === 'saleClaim') {
            shadowSignFromCookie(addVoteConsentSpec, {
              type: 'decision',
              id: String(askId),
              what: true,
              order: saleClaim?.standingOrder ?? 1
            });
          }
          if (result.data?.consensus) {
            onAcsept?.({ ani: 'askedma', coinlapach });
          }
          // Non-consensus: UI already updated locally (noofusersOk++)
        } else {
          error1 = result.error;
        }
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  // ── saleClaim negotiation (counter / precision round) ─────────────────────
  let negoModal = $state(false);
  let nqty = $state(1);
  let nprice = $state(0);
  let nstart = $state('');
  let nfinish = $state('');
  let nnote = $state('');
  let negoBusy = $state(false);

  // ISO datetime → yyyy-mm-dd for <input type="date"> (empty when absent).
  function toDateInput(d) {
    if (!d) return '';
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }

  function openNego() {
    nqty = saleClaim?.standing?.hm ?? saleClaim?.current?.unit ?? 1;
    nprice = saleClaim?.standing?.price ?? 0;
    nstart = toDateInput(saleClaim?.standing?.sqadualed ?? saleClaim?.current?.startDate);
    nfinish = toDateInput(saleClaim?.standing?.sqadualedf ?? saleClaim?.current?.finishDate);
    nnote = saleClaim?.standing?.notes ?? saleClaim?.current?.note ?? '';
    negoModal = true;
  }

  async function sendNego() {
    if (negoBusy) return;
    negoBusy = true;
    // A counter refines the version on the table: quantity, unit price, the
    // start/finish dates and a free-text note. Empty date inputs clear the date.
    const newValues = {
      hm: Number(nqty),
      price: Number(nprice),
      kindOf: saleClaim?.standing?.kindOf ?? null,
      sqadualed: nstart ? new Date(nstart).toISOString() : null,
      sqadualedf: nfinish ? new Date(nfinish).toISOString() : null,
      notes: nnote?.trim() ? nnote.trim() : null
    };
    try {
      const result = await executeAction('counterSaleClaim', {
        decisionId: String(askId),
        projectId: String(projectId),
        newValues
      });
      if (result.success) {
        // Shadow-sign the proposal.counter with the resulting round number.
        shadowSignFromCookie(proposalCounterConsentSpec, {
          decisionId: String(askId),
          order: result.data?.order,
          newValues
        });
        already = true;
        negoModal = false;
        toast.success(
          get(t)('lev.decisionMaking.refinementSent')
        );
        onAcsept?.({ ani: 'askedma', coinlapach });
      } else {
        error1 = result.error;
        toast.error(get(t)('lev.decisionMaking.couldNotSend'));
      }
    } catch (e) {
      error1 = e;
      toast.error(get(t)('lev.decisionMaking.couldNotSend'));
    } finally {
      negoBusy = false;
    }
  }
  async function decline() {
    already = true;
    noofusersNo += 1;
    noofusersWaiting -= 1;
    ser = xyz();
  }

  // saleClaim chat: ensure a forum exists on the Decision (bilateral discussion,
  // the "clarify" path — never a veto) and hand its id up to the lev-page chat
  // drawer, exactly like pendm/pmash vote cards.
  let saleClaimForumId = $state(null);
  async function openSaleClaimChat() {
    console.log('[saleClaim][chat] button clicked', { askId, projectId });
    // Close this card's own right-side drawer first, otherwise it covers the
    // small draggable chat widget (rendered by the page footer).
    dialogOpen = false;
    let fid = saleClaimForumId;
    if (!fid) {
      try {
        const r = await executeAction('ensureVoteForum', {
          entityType: 'decision',
          entityId: String(askId),
          projectId: String(projectId)
        });
        console.log('[saleClaim][chat] ensureVoteForum result', r);
        if (r.success) fid = r.data?.forumId ?? null;
      } catch (e) {
        console.error('[saleClaim][chat] ensureVoteForum threw', e);
      }
    }
    saleClaimForumId = fid;
    console.log('[saleClaim][chat] resolved forumId → calling onChat', {
      fid,
      hasOnChat: typeof onChat === 'function'
    });
    if (fid) onChat?.({ forumId: String(fid) });
    else onChat?.();
  }

  let h = $state(0);

  let u = $state('');

  function hover(id) {
    u = id == '0' ? $t('lev.decision.logoVote') : id;
    onHover?.({ id: u });
  }

  function hoverc(event) {
    u = event.x == '0' ? $t('lev.decision.logoVote') : event.x;
    onHover?.({ id: u });
  }
  import Card from './cards/hachlata.svelte';
  import { idPr } from '$lib/stores/idPr';
    
  let dialogOpen = $state(false);
  let top = $state();
  function handler(event) {
    console.log(event);
  }
  let ww = $state(0);

  let scale = $state(1);
  $effect(() => {
    if (ww < h) {
      if (ww < 380) {
        scale = ww / 92;
      } else if (ww < 430) {
        scale = ww / 102;
      } else if (ww < 470) {
        scale = ww / 112;
      } else {
        scale = ww / 132;
      }
    } else {
      if (ww < 380) {
        scale = h / 92;
      } else if (ww < 430) {
        scale = h / 102;
      } else if (ww < 470) {
        scale = h / 112;
      } else {
        scale = h / 132;
      }
    }
  });
</script>

<Card
  onAgree={() => agree()}
  onDecline={() => decline()}
  onNegotiate={openNego}
  onChat={openSaleClaimChat}
  onHover={hoverc}
  {already}
  {projectName}
  {src}
  {src2}
  {isVisible}
  {low}
  {kind}
  {users}
  {projectId}
  {onProj}
  {spdata}
  {saleClaim}

  {askwant}
  {timegramaDate}
  {restime}
  {deadline}
  {noofusersWaiting}
  {noofusersOk}
  {openmissionName}
  {missionDetails}
  {noofusersNo}
  currentValue={decisionCurrentValue}
  newValue={decisionNewValue}
  lookProposal={decisionLook}
  previewHref={decisionPreviewHref}
/>

{#if negoModal}
  <!-- Portal to <body>: the card lives inside Swiper's transformed subtree,
       which would otherwise trap this position:fixed overlay. -->
  <Portal>
  <div
    class="nego-overlay"
    role="button"
    tabindex="0"
    onclick={(e) => {
      if (e.target === e.currentTarget) negoModal = false;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') negoModal = false;
    }}
  >
    <div class="nego-card" dir={$isRtl ? 'rtl' : 'ltr'}>
      <h3 class="nego-title">
        {$t('lev.decisionMaking.refineSaleClaim')}
      </h3>
      <p class="nego-sub">
        {$t('lev.decisionMaking.proposeVersion')}
      </p>

      <label class="nego-label">
        {$t('lev.decisionMaking.quantity')}
        <span class="nego-ref"
          >{$t('lev.decisionMaking.onTable')} {saleClaim?.standing?.hm ?? '—'}</span
        >
        <input class="nego-input" type="number" min="0" step="any" bind:value={nqty} />
      </label>

      <label class="nego-label">
        {$t('lev.decisionMaking.pricePerUnit')}
        <span class="nego-ref"
          >{$t('lev.decisionMaking.onTable')} {saleClaim?.standing?.price ?? '—'}</span
        >
        <input class="nego-input" type="number" min="0" step="any" bind:value={nprice} />
      </label>

      <div class="nego-dates">
        <label class="nego-label">
          {$t('lev.decisionMaking.start')}
          <input class="nego-input" type="date" bind:value={nstart} />
        </label>
        <label class="nego-label">
          {$t('lev.decisionMaking.finish')}
          <input class="nego-input" type="date" bind:value={nfinish} />
        </label>
      </div>

      <label class="nego-label">
        {$t('lev.decisionMaking.note')}
        <textarea class="nego-input" rows="2" bind:value={nnote}
          placeholder={$t('lev.decisionMaking.optionalClarification')}
        ></textarea>
      </label>

      <p class="nego-total">
        {$t('lev.decisionMaking.total')}: <Money amount={(Number(nqty) || 0) * (Number(nprice) || 0)} {projectId} />
      </p>

      <div class="nego-actions">
        <button class="nego-btn nego-cancel" onclick={() => (negoModal = false)}>
          {$t('lev.decisionMaking.cancel')}
        </button>
        <button class="nego-btn nego-send" onclick={sendNego} disabled={negoBusy}>
          {negoBusy ? $t('lev.decisionMaking.sending') : $t('lev.decisionMaking.sendRefinement')}
        </button>
      </div>
    </div>
  </div>
  </Portal>
{/if}

<style>
  .nego-dates {
    display: flex;
    gap: 10px;
  }
  .nego-dates .nego-label {
    flex: 1;
  }
  .nego-overlay {
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .nego-card {
    background: #1f1f1f;
    border: 1px solid var(--barbi-pink, #ff0092);
    border-radius: 16px;
    padding: 20px;
    width: 100%;
    max-width: 360px;
    color: var(--gold, #eee8aa);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
  .nego-title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: bold;
    color: var(--barbi-pink, #ff0092);
    text-align: center;
  }
  .nego-sub {
    margin: 0 0 14px;
    font-size: 12px;
    opacity: 0.8;
    text-align: center;
  }
  .nego-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .nego-ref {
    font-size: 11px;
    opacity: 0.6;
  }
  .nego-input {
    background: #333;
    border: 1px solid var(--barbi-pink, #ff0092);
    border-radius: 8px;
    padding: 8px;
    color: var(--gold, #eee8aa);
    width: 100%;
  }
  .nego-total {
    text-align: center;
    font-weight: bold;
    margin: 8px 0 14px;
  }
  .nego-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  .nego-btn {
    border-radius: 999px;
    padding: 8px 16px;
    font-weight: bold;
    cursor: pointer;
    border: 1px solid var(--barbi-pink, #ff0092);
  }
  .nego-cancel {
    background: transparent;
    color: var(--gold, #eee8aa);
  }
  .nego-send {
    background: var(--barbi-pink, #ff0092);
    color: var(--gold, #eee8aa);
  }
  .nego-send:disabled {
    opacity: 0.6;
    cursor: default;
  }

</style>
