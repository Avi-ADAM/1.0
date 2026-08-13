<script>
  import { t, isRtl} from '$lib/translations';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';

  // Modernization Imports
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import { getProjectData } from '$lib/stores/projectStore';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} agprice
   * @property {any} useraplyname
   * @property {any} src2
   * @property {any} missionBName
   * @property {boolean} [already]
   * @property {any} yers
   * @property {any} projectName
   * @property {any} src
   * @property {any} kindOf
   * @property {any} noofusersWaiting
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} monts
   * @property {number} [hm]
   * @property {any} spnot
   * @property {boolean} [allr]
   * @property {(payload: { x: any }) => void} [onHover]
   * @property {(payload: { alr: any, y: string }) => void} [onAgree]
   * @property {(payload: { alr: any, y: string }) => void} [onDecline]
   * @property {(payload: { alr: any, y: string }) => void} [onNego]
   * @property {(payload: { amount: number }) => void} [onReport]
   * @property {() => void} [onTochat]
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {Function} [onProj]
   * @property {number} [noOfusers]
   * @property {boolean} [isRecurringCycle]
   * @property {boolean} [cycleReported]
   * @property {any} [cycleIndex]
   * @property {number} [quantityDelivered]
   * @property {number} [pricePerUnit]
   * @property {boolean} [isResponsible]
   * @property {boolean} [awaitingReport]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    agprice,
    useraplyname,
    src2,
    missionBName,
    already = $bindable(false),
    yers,
    projectName,
    src,
    kindOf,
    noofusersWaiting,
    noofusersOk,
    noofusersNo,
    monts,
    hm = 1,
    spnot,
    allr = false,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onReport,
    onTochat,
    // Modern Props
    glowColor = 'teal',
    users = [],
    projectId,
    activeOrder = 0,
    onProj,
    noOfusers = 0,
    // Recurring monthly resource cycle (mashabetahalich engine)
    isRecurringCycle = false,
    cycleReported = false,
    cycleIndex,
    quantityDelivered = 0,
    pricePerUnit = 0,
    isResponsible = false,
    awaitingReport = false
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
  });
  function hover(x) {
    onHover?.({ x: x });
  }
  // Accessible names for the two icon-only actions. They were reachable only by
  // hovering, which leaves a screen reader — and anyone on touch — with a pair
  // of unlabelled buttons on the one card that closes a resource receipt.
  let approveLabel = $derived(
    isRecurringCycle ? $t('lev.cards.dowegeot.approveMonthlyExpense') : $t('common.approve')
  );
  let declineLabel = $derived(
    isRecurringCycle ? $t('lev.cards.dowegeot.counterOffer') : $t('lev.cards.confirmDecline')
  );
  /** Inline bilingual helper for the recurring-cycle strings. */
  // The responsible owner types this month's actual spend right on the card.
  // `reportInput` is null until the owner edits it; until then we show the
  // reported/planned default, so no $effect-seeding is needed.
  let reportInput = $state(/** @type {number | null} */ (null));
  const plannedDefault = $derived(Number(quantityDelivered || pricePerUnit || 0));
  const effectiveAmount = $derived(reportInput ?? plannedDefault);
  // שווי המשאב עבור "החלק שלך בריקמה": מחזור מתחדש נמדד בסכום המדווח/מתוכנן
  // לחודש הזה, ואספקה חד-פעמית לפי אותו חישוב שמוצג בשורת הכסף שמעליה.
  const equityValue = $derived(
    isRecurringCycle
      ? Number(effectiveAmount) || 0
      : kindOf === 'perUnit'
        ? (Number(agprice) || 0) * (Number(hm) || 1)
        : kindOf === 'monthly'
          ? (Number(agprice) || 0) * (Number(monts) || 1)
          : kindOf === 'yearly'
            ? (Number(agprice) || 0) * (Number(yers) || 1)
            : Number(agprice) || 0
  );
  function report() {
    already = true;
    onReport?.({ amount: Number(effectiveAmount) || 0 });
  }
  function agree(alr) {
    already = true;
    onAgree?.({ alr: alr, y: 'a' });
  }
  function decline(alr) {
    already = true;
    onDecline?.({ alr: alr, y: 'd' });
  }
  function nego(alr) {
    onNego?.({ alr: alr, y: 'n' });
  }
  function tochat() {
    onTochat?.();
  }
  function handleProjectClick() {
    if (onProj) onProj();
  }

</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$isRtl ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} lg:w-[90%] {isVisible
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowColor === 'gold'
    ? '238, 232, 170'
    : glowColor === 'barbi'
      ? '255, 0, 146'
      : glowColor === 'blue'
        ? '116, 191, 255'
        : glowColor === 'green'
          ? '2, 255, 187'
          : glowColor === 'orange'
            ? '254, 172, 49'
            : glowColor === 'purple'
              ? '168, 85, 247'
              : glowColor === 'red'
                ? '239, 68, 68'
                : glowColor === 'teal'
                  ? '20, 184, 166'
                  : '2, 255, 187'}
>
  <!-- Header -->
  <CardHeader
    logoSrc={src2}
    {projectName}
    cardType={$t('lev.cards.dowegeot.head')}
    cardTitle={missionBName}
    memberCount={noOfusers}
    {glowColor}
    onProjectClick={handleProjectClick}
  >
    {#snippet voteSummary()}
      {#if !isMobileOrTablet() && user_1s && user_1s.length > 0}
        <div
          class="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm"
        >
          <VoteStatusDisplay
            compact
            votes={users || []}
            members={user_1s}
            {activeOrder}
          />
        </div>
      {/if}
    {/snippet}
  </CardHeader>

  <!-- Content Area -->
  <div
    class=" d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <div class="flex flex-col space-y-3">
      <div
        class="flex items-center mt-2 bg-gray-100 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600"
      >
        <img
          class="w-12 h-12 rounded-full mx-4 object-cover border-2 border-barbi/30"
          src={src.length > 0
            ? src
            : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
          alt="user profile"
        />
        <div class="flex flex-col">
          <p class="text-gray-900 dark:text-gray-100 font-bold mb-1">
            {useraplyname}
          </p>
        </div>
      </div>
      <!-- Price Calculation -->
      <div
        class="text-base sm:text-lg text-gray-800 dark:text-gray-200 flex items-center space-x-2 space-x-reverse"
      >
        <img
          style="width:2.5rem;"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        {#if isRecurringCycle}
          <div class="flex flex-col gap-2 w-full">
            <span class="font-bold text-base">
              🔁 {$t('lev.cards.dowegeot.recurringMonthlyExpense')}
              {#if cycleIndex}<span style="color:var(--barbi-pink)"> · {$t('lev.cards.dowegeot.cycle')} #{cycleIndex}</span>{/if}
            </span>
            {#if isResponsible}
              <!-- The owner reports the actual spend right here. -->
              <label class="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                {$t('lev.cards.dowegeot.howMuchThisMonth')}
                <span class="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={effectiveAmount}
                    oninput={(e) => (reportInput = Number(e.currentTarget.value))}
                    class="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-base text-gray-900 dark:text-gray-100"
                    placeholder={`~${pricePerUnit}`}
                  />
                  <span class="font-bold">₪</span>
                </span>
                <span class="text-xs text-gray-500">
                  {$t('lev.cards.dowegeot.planned')}: ~{pricePerUnit.toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪
                </span>
              </label>
            {:else if cycleReported}
              <!-- Members approve the spend the responsible owner reported. -->
              <div class="flex flex-col gap-0.5">
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {$t('lev.cards.dowegeot.toApproveReported')}
                  <span class="font-bold">{useraplyname}</span>:
                </span>
                <span style="color:var(--barbi-pink)" class="font-extrabold text-2xl">
                  {quantityDelivered.toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪
                </span>
                <span class="text-xs text-gray-500">
                  {$t('lev.cards.dowegeot.forLabel')} {missionBName}{#if cycleIndex} · {$t('lev.cards.dowegeot.cycle')} #{cycleIndex}{/if}
                </span>
              </div>
            {:else}
              <span style="color:#9aa0a6;">
                ~{pricePerUnit.toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪
                {$t('lev.cards.dowegeot.notYetReported')}
              </span>
            {/if}
          </div>
        {:else if kindOf === 'perUnit'}
          <p>
            <span
              onmouseenter={() =>
                hover($t('lev.cards.common.perUnitValue'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {$t('lev.cards.dowegeot.perUnit')}
            </span>
            *
            <span
              onmouseenter={() => hover($t('deals.metaQuantity'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {hm == 1 ? `${$t('lev.cards.dowegeot.oneUnit')}` : `${hm} ${$t('lev.cards.dowegeot.units')}`}
            </span>
            =
            <span
              onmouseenter={() => hover($t('lev.cards.voteCard.inTotal'))}
              onmouseleave={() => hover('0')}
              class="font-bold"
            >
              {(agprice * hm).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
              {$t('lev.cards.voteCard.inTotal')}
            </span>
          </p>
        {:else if kindOf === 'total' || kindOf === 'rent'}
          <p>
            <span
              onmouseenter={() =>
                hover($t('lev.rektom.offeredValue'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </p>
        {:else if kindOf === 'monthly'}
          <p>
            <span
              onmouseenter={() =>
                hover($t('lev.cards.common.monthlyValue'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {$t('lev.cards.dowegeot.perMonth')}
            </span>
            *
            <span
              onmouseenter={() =>
                hover($t('lev.cards.common.numMonths'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {monts == 1 ? `${$t('lev.cards.voteCard.oneMonth')}` : `${monts} ${$t('lev.cards.dowegeot.months')}`}
            </span>
            =
            <span
              onmouseenter={() => hover($t('lev.cards.voteCard.inTotal'))}
              onmouseleave={() => hover('0')}
              class="font-bold"
            >
              {$t('lev.cards.voteCard.inTotal')}
              {(agprice * monts).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
            </span>
          </p>
        {:else if kindOf === 'yearly'}
          <p>
            <span
              onmouseenter={() =>
                hover($t('lev.cards.common.yearlyValue'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {$t('lev.cards.voteCard.perYear')}
            </span>
            *
            <span
              onmouseenter={() =>
                hover($t('lev.cards.common.numYears'))}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {yers == 1 ? `${$t('lev.cards.voteCard.oneYear')}` : `${yers} ${$t('lev.cards.voteCard.years')}`}
            </span>
            =
            <span
              onmouseenter={() => hover($t('lev.cards.voteCard.inTotal'))}
              onmouseleave={() => hover('0')}
              class="font-bold"
            >
              {$t('lev.cards.voteCard.inTotal')}
              {(agprice * yers).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
            </span>
          </p>
        {/if}
      </div>

      <!-- שווי צפוי בריקמה — מה החלק שהמשאב הזה מקנה בריקמה. מחזור של הוצאה
           מתחדשת כבר נמנה בזרימה החודשית של הריקמה (alreadyCountedIn="approved"),
           ואילו אספקה חד-פעמית עוד לא נמצאת באף דלי. -->
      {#if projectId && equityValue > 0}
        <EquityPreview
          {projectId}
          missionValue={equityValue}
          monthlyValue={isRecurringCycle ? equityValue : null}
          alreadyCountedIn={isRecurringCycle ? 'approved' : 'none'}
          subject="resource"
          titleKey="equity.yourShareIfGiven"
          compact={isMobileOrTablet()}
          onHover={(x) => hover(x)}
        />
      {/if}

      <!-- Notes -->
      {#if spnot !== null && spnot !== 'null' && spnot !== 'undefined' && spnot !== undefined}
        <p
          class="cd d max-h-16 text-gray-700 dark:text-gray-300 text-base sm:text-lg bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-600"
        >
          {spnot}
        </p>
      {/if}

      <!-- User and Vote summary -->
    </div>
  </div>

  <!-- Vote Status Display Details (if available) -->
  {#if user_1s && user_1s.length > 0 && isMobileOrTablet()}
    <div class="px-4 pb-4 bg-gray-200 dark:bg-slate-700 transition-all-300">
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {/if}

  <!-- Footer Actions -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      {#if awaitingReport}
        <p class="flex-1 text-center text-sm text-gray-500 dark:text-gray-400 py-2">
          ⏳ {$t('lev.cards.dowegeot.approveOnlyAfterReport')}
        </p>
      {:else if already === false && allr === false}
        {#if isRecurringCycle && isResponsible}
          <!-- The responsible owner reports the actual spend (counts as YES). -->
          <button
            class="flex-1 py-2 px-4 flex justify-center items-center gap-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            onclick={report}
            aria-label={$t('lev.cards.dowegeot.reportApprove')}
            title={$t('lev.cards.dowegeot.reportApprove')}
            onmouseenter={() => hover($t('lev.cards.dowegeot.reportApprove'))}
            onmouseleave={() => hover('0')}
          >
            {$t('lev.cards.dowegeot.reportAndApprove')}
            <Lev />
          </button>
        {:else}
          <!-- Objection: a hard decline for one-off maaps, a counter-offer
               (propose a different amount + reason) for recurring cycles. -->
          <button
            class="flex-1 py-2 flex justify-center items-center gap-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all"
            onclick={isRecurringCycle ? () => nego('f') : () => decline('f')}
            aria-label={declineLabel}
            title={declineLabel}
            onmouseenter={() => hover(declineLabel)}
            onmouseleave={() => hover('0')}
          >
            {#if isRecurringCycle}{$t('lev.cards.dowegeot.counterOffer')}{:else}<No />{/if}
          </button>
          <!-- Icon-only, and the only control that closes a resource receipt:
               without a name it is invisible to a screen reader and unexplained
               to everyone else until they hover. -->
          <button
            class="flex-2 py-2 px-4 flex justify-center items-center gap-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            onclick={() => agree('f')}
            aria-label={approveLabel}
            title={approveLabel}
            onmouseenter={() => hover(approveLabel)}
            onmouseleave={() => hover('0')}
          >
            {#if isRecurringCycle}{$t('lev.cards.dowegeot.approveExpense')}{/if}
            <Lev />
          </button>
        {/if}
      {/if}
    {:else if low == true}
      <Lowbtn isCart="true" />
    {/if}
  </div>
</div>

<style>
  .cd {
    overflow-y: auto;
  }

  .flex-2 {
    flex: 2;
  }

  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
