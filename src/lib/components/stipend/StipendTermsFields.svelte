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

  /**
   * @typedef {Object} Props
   * @property {any} terms - bindable terms object
   * @property {number|null} [marketRate] - the mission's ₪/hour, for the ceiling guard
   * @property {any} [policy] - the rikma's stipendPolicy (null = legacy = bilateral)
   * @property {boolean} [showBudget] - programs need a total budget; a pledge may skip it
   * @property {boolean} [showAdvanced] - caps, notice, revenue trigger
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
    showAdvanced = true
  } = $props();

  const scope = $derived(consensusScope(terms));
  const validation = $derived(validateStipendTerms({ terms, marketRate, policy }));

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
    <legend class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.mode')}</legend>
    <div class="flex flex-wrap gap-2">
      {#each ['equity', 'advance', 'gift'] as m (m)}
        <label
          class="cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors
            {terms.mode === m
            ? 'border-barbi bg-barbi/10 text-barbi'
            : 'border-gray-300 dark:border-gray-600'}"
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
    <p class="text-xs text-gray-500">{$t(`stipend.mode.${terms.mode}Explain`)}</p>
  </fieldset>

  <!-- Rate -->
  <label class="flex flex-col gap-1">
    <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.rate')}</span>
    <input
      type="number"
      min="0"
      step="1"
      bind:value={terms.stipendRate}
      class="rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2"
    />
    {#if marketRate != null && marketRate > 0}
      <span class="text-xs text-gray-500">
        {$t('stipend.terms.marketRate', { count: marketRate })}
      </span>
    {/if}
  </label>

  <!-- α — who carries the cost -->
  {#if terms.mode === 'equity'}
    <div class="flex flex-col gap-1">
      <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.costShare')}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        bind:value={terms.costShare}
        class="accent-[var(--barbi-pink,#ff00ae)]"
      />
      <div class="flex justify-between text-xs text-gray-500">
        <span>{$t('stipend.terms.costShareRikma')}</span>
        <span class="font-bold text-gray-700 dark:text-gray-200">
          {Math.round(Number(terms.costShare) * 100)}%
        </span>
        <span>{$t('stipend.terms.costShareRecipient')}</span>
      </div>
      <p class="text-xs text-gray-500">
        {Number(terms.costShare) >= 0.999
          ? $t('stipend.terms.costShareExplainFull')
          : Number(terms.costShare) <= 0.001
            ? $t('stipend.terms.costShareExplainNone')
            : $t('stipend.terms.costShareExplainMixed')}
      </p>
    </div>
  {/if}

  {#if showBudget}
    <label class="flex flex-col gap-1">
      <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.totalCap')}</span>
      <input
        type="number"
        min="0"
        step="100"
        bind:value={terms.totalCap}
        class="rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2"
      />
      <span class="text-xs text-gray-500">{$t('stipend.terms.totalCapExplain')}</span>
    </label>
  {/if}

  {#if showAdvanced}
    <details class="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <summary class="cursor-pointer text-sm font-semibold">{$t('stipend.terms.more')}</summary>
      <div class="mt-3 flex flex-col gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.monthlyCap')}</span>
          <input
            type="number"
            min="0"
            step="100"
            bind:value={terms.monthlyCap}
            class="rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2"
          />
        </label>
        {#if !showBudget}
          <label class="flex flex-col gap-1">
            <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.totalCap')}</span>
            <input
              type="number"
              min="0"
              step="100"
              bind:value={terms.totalCap}
              class="rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2"
            />
            <span class="text-xs text-gray-500">{$t('stipend.terms.totalCapExplain')}</span>
          </label>
        {/if}
        <label class="flex flex-col gap-1">
          <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.noticeCycles')}</span>
          <input
            type="number"
            min="0"
            step="1"
            bind:value={terms.noticeCycles}
            class="rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-bold uppercase text-gray-500">{$t('stipend.terms.revenueTrigger')}</span>
          <input
            type="number"
            min="0"
            step="100"
            bind:value={terms.revenueTrigger}
            class="rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2"
          />
          <span class="text-xs text-gray-500">{$t('stipend.terms.revenueTriggerExplain')}</span>
        </label>
        {#if terms.mode === 'advance'}
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={terms.recourse === 'personal'}
              onchange={(e) =>
                (terms.recourse = e.currentTarget.checked ? 'personal' : 'nonRecourse')}
            />
            {$t('stipend.terms.recoursePersonal')}
          </label>
          <p class="text-xs text-gray-500">{$t('stipend.terms.recourseExplain')}</p>
        {/if}
      </div>
    </details>
  {/if}

  <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{scopeLine}</p>

  {#if !validation.ok}
    <ul class="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
      {#each validation.errors as err (err)}
        <li>{$t(`stipend.error.${err}`)}</li>
      {/each}
    </ul>
  {/if}
</div>
