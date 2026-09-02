<script>
  /**
   * The four facts a stipend cycle card must state before it asks anyone for
   * anything: **which work**, **which period**, **how the number was reached**,
   * and **what it does to the percentages** (PLAN_STIPEND §6, §8).
   *
   * Both cards used to show an amount, a count of hours and a rate — and
   * nothing else. The recipient was asked to confirm ₪2,100 with no way to see
   * which mission it answered or which month it covered, and the sentence
   * "confirming updates the shares" never said by how much
   * (docs/FIXES.md §12, §13).
   *
   * One component, so the funder's card and the recipient's card can never
   * describe the same cycle differently.
   */
  import { t, locale } from '$lib/translations';
  import { cycleLabel } from '$lib/stipend/cycleLabel.js';
  import { WELL, LABEL, BODY, MUTED, ACCENT, FAINT } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {string[]} [missionNames] - the work the hours were logged on
   * @property {string|null} [cycleStart]
   * @property {string|null} [cycleEnd]
   * @property {number} hours - approved hours behind the amount
   * @property {number} stipendRate - ₪ per approved hour
   * @property {number} amount - what is actually due/sent
   * @property {number} [gross] - hours × rate before any cap
   * @property {string|null} [cappedBy] - monthlyCap | totalCap | programCap | equityFloor
   * @property {boolean} [exhausts] - this payment closes the budget
   * @property {string} [mode] - equity | gift
   * @property {number} [equityDebit] - ₪ of equity the recipient gives up
   * @property {number} [equityCredit] - ₪ of equity the funder gains
   * @property {'funder'|'recipient'} [side] - whose card this is
   */

  /** @type {Props} */
  let {
    missionNames = [],
    cycleStart = null,
    cycleEnd = null,
    hours = 0,
    stipendRate = 0,
    amount = 0,
    gross = 0,
    cappedBy = null,
    exhausts = false,
    mode = 'equity',
    equityDebit = 0,
    equityCredit = 0,
    side = 'funder'
  } = $props();

  const period = $derived(cycleLabel(cycleStart, cycleEnd, $locale || 'he'));
  const work = $derived((missionNames ?? []).filter(Boolean));
  // A gift moves cash and nothing else, so there is no share line to show.
  const movesEquity = $derived(mode === 'equity' && (equityDebit > 0 || equityCredit > 0));
  const money = (n) => `₪${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
</script>

<div class="{WELL} p-3 space-y-3">
  {#if work.length || period}
    <div class="grid gap-3 sm:grid-cols-2">
      {#if work.length}
        <div class="min-w-0">
          <span class={LABEL}>{$t('stipend.cycle.forWork')}</span>
          <p class="{BODY} text-sm font-medium break-words">{work.join(' · ')}</p>
        </div>
      {/if}
      {#if period}
        <div class="min-w-0">
          <span class={LABEL}>{$t('stipend.cycle.period')}</span>
          <p class="{BODY} text-sm font-medium">{period}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- The calculation, spelled out. Nothing in this line is typed by anyone. -->
  <div class="calc">
    <span class={BODY}>{$t('stipend.pay.hours', { count: hours })}</span>
    <span class={FAINT}>×</span>
    <span class={BODY}>{money(stipendRate)}</span>
    <span class={FAINT}>=</span>
    <span class="text-lg font-bold {ACCENT}">{money(amount)}</span>
  </div>

  {#if cappedBy}
    <p class="text-xs text-amber-700 dark:text-amber-300">
      {$t(`stipend.pay.capped.${cappedBy}`, { count: Number(gross).toFixed(2) })}
    </p>
  {/if}
  {#if exhausts}
    <p class="text-xs text-amber-700 dark:text-amber-300">{$t('stipend.pay.lastCycle')}</p>
  {/if}

  {#if movesEquity}
    <div class="equity">
      <span class={LABEL}>{$t('stipend.cycle.equityTitle')}</span>
      <p class="{MUTED} leading-relaxed">
        {#if side === 'recipient'}
          {equityDebit > 0
            ? $t('stipend.cycle.equityRecipient', { count: money(equityDebit) })
            : $t('stipend.cycle.equityRecipientNone')}
        {:else}
          {$t('stipend.cycle.equityFunder', { count: money(equityCredit) })}
        {/if}
      </p>
    </div>
  {:else if mode === 'gift'}
    <p class={MUTED}>{$t('stipend.mode.giftExplain')}</p>
  {/if}
</div>

<style>
  .calc {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem;
  }
  .equity {
    border-top: 1px solid rgb(148 163 184 / 0.3);
    padding-top: 0.6rem;
  }
</style>
