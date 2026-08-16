<script>
  /**
   * "This mission also wants a subsistence stipend" — stated while the mission
   * is being written (docs/PLAN_STIPEND.md §13).
   *
   * Asking here rather than in a separate negotiation afterwards is what makes
   * the dilution answerable at all: the rikma is already voting on hours × rate,
   * so the stipend's **maximum** cost is a closed number on the same card —
   * exactly the bound §4 requires before anyone can approve being diluted.
   *
   * Two questions, in the order people actually ask them:
   *   1. how much per hour, and
   *   2. does it dilute — i.e. does the recipient pay for it out of their own
   *      share (α=1, nobody else affected) or does the whole rikma carry it
   *      (α=0, everyone diluted together, and everyone therefore votes on it).
   */
  import { t } from '$lib/translations';
  import { computeRecipientTradeoff } from '$lib/stipend/computeStipendEquity.js';
  // The mission form paints its own dark pink panel, so this block cannot
  // inherit its ink from the page — it states its own ground and its own
  // neutrals, for both identities and both modes. See ./ui.js.
  import {
    SURFACE,
    ACCENT,
    LABEL,
    MUTED,
    FAINT,
    INPUT,
    WELL,
    WARN
  } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {number} rate - bindable ₪/hour; 0 means "no stipend"
   * @property {number} costShare - bindable α
   * @property {string} mode - bindable equity | advance | gift
   * @property {number} [marketRate] - the mission's own ₪/hour: the hard ceiling
   * @property {number} [hours] - assigned hours, for the closed budget
   * @property {boolean} [iskvua] - recurring: the budget is per cycle
   */

  /** @type {Props} */
  let {
    rate = $bindable(0),
    costShare = $bindable(1),
    mode = $bindable('equity'),
    marketRate = 0,
    hours = 0,
    iskvua = false
  } = $props();

  let open = $state(false);

  const active = $derived(Number(rate) > 0);
  const dilutes = $derived(
    active && mode === 'equity' && Number(costShare) < 1
  );
  const budget = $derived(
    active && Number(hours) > 0 ? Math.round(Number(rate) * Number(hours)) : 0
  );
  const tooHigh = $derived(
    active && Number(marketRate) > 0 && Number(rate) > Number(marketRate)
  );

  // What the person doing the mission trades away: their share, against cash in
  // hand. The same function the signing card uses, so the number they are shown
  // here is the number they will be asked to sign.
  const tradeoff = $derived(
    active && mode === 'equity' && Number(hours) > 0 && Number(marketRate) > 0
      ? computeRecipientTradeoff({
          missionValue: Number(hours) * Number(marketRate),
          stipendTotal: budget,
          rikmaTotalWithout: 0,
          terms: {
            mode,
            costShare: Number(costShare),
            equityMultiplier: 1,
            stipendRate: Number(rate)
          }
        })
      : null
  );

  function toggle() {
    open = !open;
    if (!open) rate = 0;
    else if (!rate && marketRate > 0) rate = Math.round(Number(marketRate) / 4);
  }
</script>

<div class="{SURFACE} p-3 my-2">
  <button
    type="button"
    class="flex w-full items-center justify-between gap-2 text-start"
    onclick={toggle}
  >
    <span class="font-bold {ACCENT}">
      💗 {$t('stipend.mission.title')}
    </span>
    <span class="text-sm {MUTED}">{open || active ? '−' : '+'}</span>
  </button>

  {#if !open && !active}
    <p class="mt-1 {MUTED}">{$t('stipend.mission.hint')}</p>
  {/if}

  {#if open || active}
    <div class="mt-3 flex flex-col gap-3">
      <label class="flex flex-col gap-1">
        <span class={LABEL}>{$t('stipend.terms.rate')}</span>
        <input type="number" min="0" step="1" bind:value={rate} class={INPUT} />
        {#if Number(marketRate) > 0}
          <span class={MUTED}>
            {$t('stipend.terms.marketRate', { count: marketRate })}
          </span>
        {/if}
      </label>

      {#if tooHigh}
        <p class="{WARN} p-2 text-sm">
          {$t('stipend.error.rateAboveMarket')}
        </p>
      {/if}

      {#if active}
        <!-- The dilution question, asked as a question and not as a slider
             labelled with a Greek letter. -->
        <fieldset class="flex flex-col gap-1">
          <legend class={LABEL}>
            {$t('stipend.mission.whoPays')}
          </legend>
          <label class="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="stipend-dilutes"
              checked={!dilutes}
              onchange={() => {
                costShare = 1;
                mode = 'equity';
              }}
            />
            <span>
              <b>{$t('stipend.mission.noDilution')}</b>
              <span class="block {MUTED}">
                {$t('stipend.mission.noDilutionExplain')}
              </span>
            </span>
          </label>
          <label class="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="stipend-dilutes"
              checked={dilutes}
              onchange={() => {
                costShare = 0;
                mode = 'equity';
              }}
            />
            <span>
              <b>{$t('stipend.mission.dilutes')}</b>
              <span class="block {MUTED}">
                {$t('stipend.mission.dilutesExplain')}
              </span>
            </span>
          </label>
          <label class="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="stipend-dilutes"
              checked={mode === 'gift'}
              onchange={() => {
                mode = 'gift';
                costShare = 1;
              }}
            />
            <span>
              <b>{$t('stipend.mode.gift')}</b>
              <span class="block {MUTED}">{$t('stipend.mode.giftExplain')}</span
              >
            </span>
          </label>
        </fieldset>

        {#if budget > 0}
          <p class="text-sm">
            {$t(
              iskvua ? 'stipend.mission.budgetCycle' : 'stipend.mission.budget',
              {
                count: budget.toLocaleString()
              }
            )}
          </p>
        {/if}

        {#if tradeoff}
          <div class="{WELL} p-2 text-xs">
            <p>
              {$t('stipend.tradeoff.without', {
                count: tradeoff.sharePctWithout.toFixed(1)
              })}
            </p>
            <p class="font-semibold">
              {$t('stipend.tradeoff.with', {
                count: tradeoff.sharePctWith.toFixed(1),
                cash: Math.round(tradeoff.cash).toLocaleString()
              })}
            </p>
          </div>
        {/if}

        <p class={FAINT}>
          {dilutes
            ? $t('stipend.mission.voteNoteRikma')
            : $t('stipend.mission.voteNoteBilateral')}
        </p>
      {/if}
    </div>
  {/if}
</div>
