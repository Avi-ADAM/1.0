<script>
  import CurrencySymbol from '$lib/components/money/CurrencySymbol.svelte';
  import Money from '$lib/components/money/Money.svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/translations';
  import { fly } from 'svelte/transition';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { idPr } from './../../stores/idPr.js';
  import { onMount } from 'svelte';
  import moment from 'moment';
  import { executeAction } from '$lib/client/actionClient';
  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [modal]
   * @property {boolean} [isVisible]
   * @property {any} coinlapach
   * @property {any} mId
   * @property {any} kindOf
   * @property {number} [myp]
   * @property {any} projectName
   * @property {any} missionBName
   * @property {any} useraplyname
   * @property {string} [src]
   * @property {string} [src2]
   * @property {any} projectId
   * @property {string} [link]
   * @property {string} [linkU]
   * @property {any} userId
   * @property {any} name
   * @property {any} spid
   * @property {number} [hm]
   * @property {number} [noofpu]
   * @property {any} spnot
   * @property {number} [price]
   * @property {number} [easy]
   * @property {any} [agprice]
   * @property {any} missId
   * @property {any} id
   * @property {any} openMid
   * @property {number} [st]
   * @property {any} [declined]
   * @property {any} noofusersWaiting
   * @property {any} uids
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} already
   * @property {string} [stylef]
   * @property {any} askId
   * @property {any} users
   * @property {any} sqadualed
   * @property {any} sqadualedf
   * @property {boolean} [cards]
   * @property {(payload: any) => void} [onUser]
   * @property {(payload: any) => void} [onProj]
   * @property {(payload: any) => void} [onAcsept]
   * @property {(payload: any) => void} [onHover]
   * @property {(payload: any) => void} [onModal]
   * @property {boolean} [isRecurringCycle] - a recurring resource's cycle Maap
   * @property {boolean} [isStockReceipt] - a supply portion on a stock resource (units, not money)
   * @property {number} [receiptUnitPrice] - the receipt's price per unit; 0 = an opening count
   * @property {boolean} [cycleReported]
   * @property {any} [mashabetahalichId]
   * @property {any} [cycleIndex]
   * @property {number} [quantityDelivered]
   * @property {number} [pricePerUnit]
   * @property {any} [responsibleUserId]
   * @property {any} [myid]
   * @property {number} [orderon]
   * @property {any} [timegramaId]
   * @property {any} [timegramaDate]
   * @property {boolean} [timegramaDone]
   */

  /** @type {Props} */
  let {
    low = false,
    modal = $bindable(false),
    isVisible = false,
    coinlapach,
    mId,
    kindOf,
    myp = 0,
    projectName,
    missionBName,
    useraplyname,
    src = 'coin.png',
    src2 = ' ',
    projectId,
    link = '/project/',
    linkU = '/user/',
    userId,
    name,
    spid,
    hm = 1,
    noofpu = 0,
    spnot,
    price = 0,
    easy = 0,
    agprice = (myp + easy) / 2,
    missId,
    id,
    openMid,
    st = 188,
    declined = [],
    noofusersWaiting = $bindable(),
    uids = $bindable(),
    noofusersOk = $bindable(0),
    noofusersNo = $bindable(0),
    already = $bindable(false),
    stylef = '24px',
    askId,
    users = [],
    sqadualed,
    sqadualedf,
    cards = false,
    // Recurring monthly resource cycle (mashabetahalich engine)
    isRecurringCycle = false,
    // …or a supply portion on a stock resource (receiveStock): units, not money
    isStockReceipt = false,
    receiptUnitPrice = 0,
    // Has the responsible user reported this month's actual spend yet?
    cycleReported = false,
    mashabetahalichId,
    cycleIndex,
    quantityDelivered = 0,
    pricePerUnit = 0,
    responsibleUserId,
    myid,
    // Current voting round + deadline clock (recurring cycles)
    orderon = 0,
    timegramaId,
    timegramaDate,
    timegramaDone = false,
    onUser,
    onProj,
    onAcsept,
    onHover,
    onModal
  } = $props();

  // The signed-in user is the one responsible for entering this month's spend.
  let isResponsible = $derived(
    isRecurringCycle && String(myid ?? '') === String(responsibleUserId ?? '')
  );
  // A member (not the responsible user) can only approve a recurring cycle once
  // the responsible user has reported the actual amount. Until then it's "pending".
  let awaitingReport = $derived(
    isRecurringCycle && !isResponsible && !cycleReported
  );
  let amountInput = $state(0);
  // Counter-offer (negotiation) on a recurring cycle.
  let nego = $state(false);
  let negoAmount = $state(0);
  let negoReason = $state('');
  // After the proposer submits a counter-offer the lev stores aren't refetched
  // (lev data is client-side), so we optimistically override the shown amount.
  let amountOverride = $state(/** @type {number | null} */ (null));
  let shownAmount = $derived(amountOverride ?? quantityDelivered);
  let resP = [];
  let lang;


  let error1;

  let monts = $state(0);
  let yers = $state();

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
    // console.log(noofusersOk,noofpu,noofusersNo,noofusersWaiting)
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
  onMount(async () => {
    var a = moment(sqadualedf);
    var b = moment(sqadualed);
    yers = a.diff(b, 'years', true).toFixed(2);
    monts = a.diff(b, 'months', true).toFixed(2);
  });

  async function agree() {
    // Members can't approve a recurring cycle before the responsible user
    // reports the actual amount.
    if (awaitingReport) return;
    // Recurring monthly cycle → confirm/edit this month's amount first.
    if (isRecurringCycle) {
      amountInput = Number(quantityDelivered || pricePerUnit || 0);
      spend = true;
      no = false;
      masa = false;
      isOpen = true;
      return;
    }
    // Optimistic UI update
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    try {
      const result = await executeAction('voteOnMaap', {
        askId: String(askId),
        projectId: String(projectId),
        what: true,
      });
      if (result.success && result.data?.consensus) {
        onAcsept?.({ ani: 'finim', coinlapach });
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  // Confirm the monthly spend (counts as a YES vote). The responsible user can
  // edit the amount; other members simply approve the proposed amount.
  async function confirmRecurring() {
    isOpen = false;
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    try {
      const result = await executeAction('voteOnMaap', {
        askId: String(askId),
        projectId: String(projectId),
        what: true,
        ...(isResponsible ? { amount: Number(amountInput) || 0 } : {}),
      });
      if (result.success && result.data?.consensus) {
        onAcsept?.({ ani: 'finim', coinlapach });
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  // Inline report from the detail card: the responsible owner types the amount
  // there and submits directly (no dialog). Counts as their report + YES vote.
  function reportFromCard(e) {
    amountInput = Number(e?.amount) || 0;
    confirmRecurring();
  }

  // Counter-offer: instead of a hard decline, a member proposes a different
  // monthly amount with a reason. Opens the negotiation dialog.
  function counter() {
    negoAmount = Number(quantityDelivered || pricePerUnit || 0);
    negoReason = '';
    spend = false;
    no = false;
    masa = false;
    nego = true;
    isOpen = true;
  }

  // Submit the counter-offer: rewrites the amount, snapshots the old one, opens a
  // new voting round, resets the timer and posts the reason to chat (server-side).
  async function submitCounter() {
    if (!negoReason.trim()) return;
    isOpen = false;
    nego = false;
    // Optimistic: the card adopts the proposed amount and a fresh voting round
    // in which only the proposer's YES counts — everyone else must re-approve.
    amountOverride = Number(negoAmount) || 0;
    already = true;
    noofusersOk = 1;
    noofusersNo = 0;
    noofusersWaiting = Math.max((noofpu || 0) - 1, 0);
    ser = xyz();
    try {
      await executeAction('submitNegoMaap', {
        askId: String(askId),
        projectId: String(projectId),
        newAmount: Number(negoAmount) || 0,
        reason: negoReason.trim()
      });
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  // An expired cycle used to be settled right here, on mount, by whichever
  // member's browser happened to open the lev page first — so a month's expense
  // was recorded or not depending on who looked. The clock now matures it
  // server-side (src/routes/api/timegrama/maap.svelte, PLAN_TIMEGRAMA D1), and
  // this card only shows the countdown.

  // Close the recurring resource entirely (stops future monthly cycles).
  async function markDone() {
    isOpen = false;
    try {
      const result = await executeAction('markResourceDone', {
        mashabetahalichId: String(mashabetahalichId),
        projectId: String(projectId),
      });
      if (result.success) {
        onAcsept?.({ ani: 'finim', coinlapach });
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  async function decline() {
    // Optimistic UI update
    already = true;
    noofusersNo += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    isOpen = false;
    try {
      await executeAction('voteOnMaap', {
        askId: String(askId),
        projectId: String(projectId),
        what: false,
        ...(whyy.trim() ? { why: whyy } : {}),
      });
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }
  function open() {
    masa = false;
    no = true;
    isOpen = true;
    console.log('if another uprove explain why you decline');
  }
  let isOpen = $state(false);
  let whyy = $state(' ');
  let no = $state();
  let masa = $state();
  let spend = $state(false);
  function close() {
    isOpen = false;
    no = false;
    masa = false;
    spend = false;
    nego = false;
  }

  let u = 'בקשה לאישור קבלת משאב בהצלחה';
  function hover(id) {
    if (id == '0') {
      u = 'בקשה לאישור קבלת משאב בהצלחה';
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }

  function hoverc(event) {
    if (event.x == '0') {
      u = 'בקשה לאישור ביצוע משימה בהצלחה';
    } else {
      u = event.x;
    }
    onHover?.({ id: u });
  }
  import Cards from './cards/dowegeot.svelte';
</script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}>
    <DialogContent aria-label="form" class="content surface-dialog">
      <div dir="rtl" class="flex items-center flex-col">
        <button
          onclick={close}
          class=" hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title={$t('lev.missionInProgress.cancel')}
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
            />
          </svg></button
        >
        {#if spend === true}
          <h1 style="font-size:1.5em;">
            {isStockReceipt
              ? $t('lev.weget.approveStockReceipt')
              : isResponsible
                ? $t('lev.weget.howMuchSpentThisMonth')
                : $t('lev.weget.approveMonthlyExpense')}
          </h1>
          <p class="text-barbi" style="font-size:0.95em; text-align:center;">
            {missionBName}{#if cycleIndex} · {$t('lev.weget.cycleLabel')} #{cycleIndex}{/if}
          </p>
          {#if isStockReceipt}
            <!-- A supply portion: units, at the price its name carries. -->
            <p class="p" style="font-size:1.6em; font-weight:bold; color:var(--goldink)">
              {$t('lev.weget.receiptUnits', { count: shownAmount })}
            </p>
            {#if receiptUnitPrice > 0}
              <p style="font-size:0.9em; text-align:center;">
                {$t('lev.weget.receiptWorth')} <Money amount={Number(shownAmount) * receiptUnitPrice} {projectId} />
              </p>
            {:else}
              <p style="font-size:0.9em; text-align:center;">{$t('lev.weget.receiptOpening')}</p>
            {/if}
          {:else if isResponsible}
            <input
              type="number"
              min="0"
              step="0.01"
              bind:value={amountInput}
              placeholder={$t('lev.weget.actualAmountPlaceholder')}
            />
          {:else}
            <p style="font-size:0.9em; color:var(--surface-muted, #6b6156); text-align:center; margin:4px 0;">
              {useraplyname} {$t('lev.weget.reportedExpenseOf')}
            </p>
            <p class="p" style="font-size:1.6em; font-weight:bold; color:var(--goldink)"><Money amount={shownAmount} {projectId} /></p>
          {/if}
          <br />
          <button class="add" onclick={confirmRecurring}>{$t('lev.weget.confirmExpense')}</button>
          {#if mashabetahalichId}
            <br />
            <button
              class="add"
              style="background-color:var(--barbi-pink); color:var(--gold); margin-top:8px;"
              onclick={markDone}
              title={$t('lev.weget.doneResourceTitle')}
            >{$t('lev.weget.doneResource')}</button>
          {/if}
        {:else if no === true}
          <h1 style="font-size:2em;">{$t('lev.weget.mustExplain')}</h1>
          <input
            minlength="26"
            type="text"
            bind:value={whyy}
            placeholder={$t('lev.weget.missingForApproval')}
          />
          <br />
          <button class="add" disabled={whyy.length < 26} onclick={decline}
            >{$t('lev.cards.confirmApprove')}</button
          >
        {:else if nego === true}
          <h1 style="font-size:1.5em;">{$t('lev.weget.proposeOtherAmount')}</h1>
          <p class="text-barbi" style="font-size:0.95em; text-align:center;">
            {missionBName}{#if cycleIndex} · {$t('lev.weget.cycleLabel')} #{cycleIndex}{/if}
          </p>
          <p style="font-size:0.85em; color:var(--surface-muted, #6b6156); text-align:center; margin:2px 0;">
            {$t('lev.weget.reportedAmount')} <Money amount={quantityDelivered} {projectId} />
          </p>
          <label style="display:flex; align-items:center; gap:6px; margin:6px 0;">
            {$t('lev.weget.proposedAmount')}
            <input
              type="number"
              min="0"
              step="0.01"
              bind:value={negoAmount}
              placeholder={$t('lev.weget.amountYouPropose')}
            />
            <CurrencySymbol />
          </label>
          <input
            minlength="3"
            type="text"
            bind:value={negoReason}
            placeholder={$t('lev.weget.whyMoveAmount')}
          />
          <br />
          <button class="add" disabled={!negoReason.trim()} onclick={submitCounter}
            >{$t('lev.weget.submitProposal')}</button
          >
        {:else if masa === true}
          <input
            minlength="26"
            type="text"
            bind:value={whyy}
            placeholder={$t('lev.weget.explainProposal')}
          />
          <input type="number" placeholder={$t('lev.weget.addHours')} />
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>
<Cards
  onAgree={agree}
  onReport={reportFromCard}
  onDecline={open}
  onNego={counter}
  onHover={hoverc}
  {isVisible}
  {low}
  {agprice}
  {useraplyname}
  {src2}
  {projectId}
  {missionBName}
  {already}
  {yers}
  {projectName}
  {src}
  {kindOf}
  {noofusersWaiting}
  {noofusersOk}
  {noofusersNo}
  {monts}
  {users}
  {hm}
  {spnot}
  {isRecurringCycle}
  {isStockReceipt}
  {receiptUnitPrice}
  {cycleReported}
  {cycleIndex}
  quantityDelivered={shownAmount}
  {pricePerUnit}
  {isResponsible}
  {awaitingReport}
/>

<style>

  input[type='text'] {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
    border: 1px solid var(--lturk);
    padding-left: 10px;
    padding-right: 10px;
  }

  input[type='text']:focus {
    outline: none;
    border: 2px solid var(--lturk);
    color: #2d9fd9;
  }

  input[type='text']:invalid {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
    border: 2px dashed var(--lturk);
    color: red;
    padding-left: 10px;
    padding-right: 10px;
  }
  .add {
    color: var(--barbi-pink);
    background-color: var(--gold);
    padding: 0.5em;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }
  .add:hover:not(:disabled) {
    color: var(--gold);
    background-color: var(--barbi-pink);
    padding: 0.5em;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }
  .add:disabled {
    color: var(--surface-muted, #6b6156);
    background-color: var(--surface-2, #f7f5ef);
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.1));
    cursor: not-allowed;
    padding: 0.5em;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }

  :global([data-svelte-dialog-content].content) {
    width: 80vw;
    z-index: 60;
  }
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].content) {
      width: 50vw;
      z-index: 60;
    }
    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
    }
  }
</style>
