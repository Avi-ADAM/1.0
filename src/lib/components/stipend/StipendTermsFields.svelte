<script>
  /**
   * The three parameters of a subsistence stipend, in one place
   * (docs/PLAN_STIPEND.md §1).
   *
   * Shared by every surface that proposes or counters one — the propose dialog,
   * the negotiation drawer, the moach tab — so the vocabulary a member learns
   * in one place is the vocabulary everywhere. The α slider is a *continuum*,
   * not a binary switch, because the plan's whole answer to "who carries the
   * cost" is that there is no single right answer.
   */
  import { t } from '$lib/translations';
  import { consensusScope, validateStipendTerms } from '$lib/stipend/computeStipendEquity.js';
  // Neutrals and inputs that hold up in personal/business × light/dark. ./ui.js
  import { LABEL, MUTED, INPUT, WELL, WARN, BODY } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {any} terms - bindable terms object
   * @property {number|null} [marketRate] - the mission's ₪/hour, for the ceiling guard
   * @property {any} [policy] - the rikma's stipendPolicy (null = legacy = bilateral)
   * @property {boolean} [showBudget] - programs need a total budget; a pledge may skip it
   * @property {boolean} [showAdvanced] - caps, notice, revenue trigger
   * @property {boolean} [allowRikmaScope] - this form *is* the rikma-wide ask (a
   *   program proposal), so "these terms dilute and the rikma only allows
   *   bilateral" is not an error here — it is the question being put.
   * @property {import('$lib/stipend/suggestBudget.js').StipendBudgetSuggestion|null} [suggestion] -
   *   the budget derived from the chosen mission (rate × its hours, and the
   *   months when it has an end date). Fills the ceiling in so nobody has to
   *   compute it, and keeps following the rate until the member types their own.
   */

  /** @type {Props} */
  let {
    terms = $bindable({
      mode: 'equity',
      costShare: 1,
      equityMultiplier: 1,
      stipendRate: 0,
      monthlyCap: null,
      totalCap: null,
      noticeCycles: 1,
      revenueTrigger: null,
      recourse: 'nonRecourse'
    }),
    marketRate = null,
    policy = null,
    showBudget = false,
    showAdvanced = true,
    allowRikmaScope = false,
    suggestion = null
  } = $props();

  /**
   * Which of the two budget shapes the form is on. Derived from the terms
   * themselves (a total budget or a monthly ceiling), so re-opening a proposal
   * lands on the shape it was written in — with one piece of local state for
   * the moment the member has switched but not yet typed the new number.
   *
   * With nothing typed yet the **mission** decides: a one-off has a size and
   * therefore a closed total, a recurring one is a monthly amount.
   */
  let shapeOverride = $state(/** @type {'total'|'monthly'|null} */ (null));
  const budgetShape = $derived(
    shapeOverride ??
      (Number(terms.totalCap) > 0
        ? 'total'
        : Number(terms.monthlyCap) > 0
          ? 'monthly'
          : (suggestion?.shape ?? 'total'))
  );

  /** Switching shape clears the other number — a program has one ceiling, not two. */
  function setBudgetShape(shape) {
    shapeOverride = shape;
    if (shape === 'total') terms.monthlyCap = null;
    else terms.totalCap = null;
  }

  /**
   * Has the member taken the budget into their own hands? Until they do, the
   * ceiling keeps following the mission and the rate — change the rate and the
   * budget changes with it, which is the whole reason it is derived. The moment
   * they type a number of their own it stops moving under them.
   */
  let budgetTouched = $state(false);

  $effect(() => {
    const s = suggestion;
    // Only where the budget is actually on screen: filling a number a member
    // cannot see would be a term nobody agreed to.
    if (!s || !showBudget || budgetTouched) return;
    const shape = shapeOverride ?? s.shape;
    if (shape === 'total') {
      // An open-ended mission has no total to derive; leave it to be typed.
      if (s.totalCap != null) {
        terms.totalCap = s.totalCap;
        terms.monthlyCap = null;
      }
    } else if (s.monthlyCap != null) {
      terms.monthlyCap = s.monthlyCap;
      terms.totalCap = null;
    }
  });

  /** Back to the number the mission implies. */
  function recomputeBudget() {
    budgetTouched = false;
    shapeOverride = null;
  }

  // How the number on screen was arrived at. Said in words, because a member
  // who does not recognise where a figure came from cannot judge it.
  // …and only about the ceiling actually on screen: explaining how the total
  // was derived under a monthly field the member switched to themselves would
  // describe a number that is not there.
  const budgetHint = $derived(
    !suggestion || budgetShape !== suggestion.shape
      ? null
      : suggestion.months != null
        ? $t('stipend.terms.budgetFromMonths', {
            amount: suggestion.amount,
            count: suggestion.months,
            total: suggestion.totalCap
          })
        : suggestion.shape === 'monthly'
          ? $t('stipend.terms.budgetFromMonthly', { amount: suggestion.amount })
          : $t('stipend.terms.budgetFromMission', { amount: suggestion.amount })
  );

  const scope = $derived(consensusScope(terms));
  const validation = $derived(validateStipendTerms({ terms, marketRate, policy }));
  // A program proposal carries `policyBilateralOnly` by definition — it is the
  // vote that would lift it — so the form does not flag it as a mistake.
  const shownErrors = $derived(
    validation.errors.filter((e) => !(allowRikmaScope && e === 'policyBilateralOnly'))
  );

  // The one number that says what kind of agreement this is. Shown as text
  // rather than hidden in a tooltip: who has to agree is the consequence
  // members most often get wrong.
  const scopeLine = $derived(
    scope === 'bilateral' ? $t('stipend.terms.scopeBilateral') : $t('stipend.terms.scopeRikma')
  );
</script>

<div class="flex flex-col gap-4">
  <!-- Mode: what the money buys -->
  <fieldset class="flex flex-col gap-1">
    <legend class={LABEL}>{$t('stipend.terms.mode')}</legend>
    <div class="flex flex-wrap gap-2">
      {#each ['equity', 'gift'] as m (m)}
        <label
          class="cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors
            {terms.mode === m
            ? 'border-barbi bg-barbi/10 text-barbi'
            : 'border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100'}"
        >
          <input
            type="radio"
            class="sr-only"
            name="stipend-mode"
            checked={terms.mode === m}
            onchange={() => (terms.mode = m)}
          />
          {$t(`stipend.mode.${m}`)}
        </label>
      {/each}
    </div>
    <p class={MUTED}>{$t(`stipend.mode.${terms.mode}Explain`)}</p>
  </fieldset>

  <!-- Rate -->
  <label class="flex flex-col gap-1">
    <span class={LABEL}>{$t('stipend.terms.rate')}</span>
    <input
      type="number"
      min="0"
      step="1"
      bind:value={terms.stipendRate}
      class={INPUT}
    />
    {#if marketRate != null && marketRate > 0}
      <span class={MUTED}>
        {$t('stipend.terms.marketRate', { count: marketRate })}
      </span>
    {/if}
  </label>

  <!-- α — who carries the cost -->
  {#if terms.mode === 'equity'}
    <div class="flex flex-col gap-1">
      <span class={LABEL}>{$t('stipend.terms.costShare')}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        bind:value={terms.costShare}
        class="accent-[var(--barbi-pink,#ff00ae)]"
      />
      <div class="flex justify-between {MUTED}">
        <span>{$t('stipend.terms.costShareRikma')}</span>
        <span class="font-bold text-gray-900 dark:text-gray-50">
          {Math.round(Number(terms.costShare) * 100)}%
        </span>
        <span>{$t('stipend.terms.costShareRecipient')}</span>
      </div>
      <p class={MUTED}>
        {Number(terms.costShare) >= 0.999
          ? $t('stipend.terms.costShareExplainFull')
          : Number(terms.costShare) <= 0.001
            ? $t('stipend.terms.costShareExplainNone')
            : $t('stipend.terms.costShareExplainMixed')}
      </p>
    </div>
  {/if}

  {#if showBudget}
    <!-- Two honest ways to bound a program, and members need both: a closed
         total ("₪6,000 and that's it"), or a monthly ceiling that runs until
         someone stops it — which is the shape subsistence usually has, since
         nobody knows in advance how many months they will need. What neither
         may skip is a ceiling: the vote has to be on an amount. -->
    <fieldset class="flex flex-col gap-2">
      <legend class={LABEL}>{$t('stipend.terms.budgetShape')}</legend>
      <div class="flex flex-wrap gap-2">
        {#each ['total', 'monthly'] as shape (shape)}
          <label
            class="cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors
              {budgetShape === shape
              ? 'border-barbi bg-barbi/10 text-barbi'
              : 'border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100'}"
          >
            <input
              type="radio"
              class="sr-only"
              name="stipend-budget-shape"
              checked={budgetShape === shape}
              onchange={() => setBudgetShape(shape)}
            />
            {$t(`stipend.terms.budgetShape_${shape}`)}
          </label>
        {/each}
      </div>

      {#if budgetShape === 'total'}
        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.terms.totalCap')}</span>
          <input
            type="number"
            min="0"
            step="100"
            bind:value={terms.totalCap}
            oninput={() => (budgetTouched = true)}
            class={INPUT}
          />
          <span class={MUTED}>{$t('stipend.terms.totalCapExplain')}</span>
        </label>
      {:else}
        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.terms.monthlyCap')}</span>
          <input
            type="number"
            min="0"
            step="100"
            bind:value={terms.monthlyCap}
            oninput={() => (budgetTouched = true)}
            class={INPUT}
          />
          <span class={MUTED}>{$t('stipend.terms.openEndedExplain')}</span>
        </label>
      {/if}

      <!-- The derivation, and the way back to it. The number above is only a
           proposal: it came from the mission, and it can be argued with. -->
      {#if budgetHint}
        <p class={MUTED}>{budgetHint}</p>
      {/if}
      {#if budgetTouched && suggestion}
        <button
          type="button"
          class="self-start text-xs underline text-gray-600 dark:text-gray-300 hover:text-goldink"
          onclick={recomputeBudget}
        >
          {$t('stipend.terms.budgetRecompute')}
        </button>
      {/if}
    </fieldset>
  {/if}

  {#if showAdvanced}
    <details class="{WELL} p-3">
      <summary class="cursor-pointer text-sm font-semibold {BODY}">{$t('stipend.terms.more')}</summary>
      <div class="mt-3 flex flex-col gap-3">
        {#if !showBudget}
          <!-- A program already chose its ceiling above; showing a second
               monthlyCap field here would let it contradict itself. -->
          <label class="flex flex-col gap-1">
            <span class={LABEL}>{$t('stipend.terms.monthlyCap')}</span>
            <input
              type="number"
              min="0"
              step="100"
              bind:value={terms.monthlyCap}
              class={INPUT}
            />
          </label>
        {/if}
        {#if !showBudget}
          <label class="flex flex-col gap-1">
            <span class={LABEL}>{$t('stipend.terms.totalCap')}</span>
            <input
              type="number"
              min="0"
              step="100"
              bind:value={terms.totalCap}
              class={INPUT}
            />
            <span class={MUTED}>{$t('stipend.terms.totalCapExplain')}</span>
          </label>
        {/if}
        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.terms.noticeCycles')}</span>
          <input
            type="number"
            min="0"
            step="1"
            bind:value={terms.noticeCycles}
            class={INPUT}
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.terms.revenueTrigger')}</span>
          <input
            type="number"
            min="0"
            step="100"
            bind:value={terms.revenueTrigger}
            class={INPUT}
          />
          <span class={MUTED}>{$t('stipend.terms.revenueTriggerExplain')}</span>
        </label>
      </div>
    </details>
  {/if}

  <p class="text-sm font-semibold text-gray-900 dark:text-gray-50">{scopeLine}</p>

  {#if shownErrors.length > 0}
    <ul class="{WARN} p-3 text-sm">
      {#each shownErrors as err (err)}
        <li>{$t(`stipend.error.${err}`)}</li>
      {/each}
    </ul>
  {/if}
</div>
