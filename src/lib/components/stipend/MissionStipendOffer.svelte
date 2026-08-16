<script>
  /**
   * What a funded mission is actually offering, in two separate lines
   * (docs/PLAN_STIPEND.md §8, §11.1).
   *
   * These are two different things and the whole model depends on nobody
   * confusing them:
   *
   *   השקעה בפרויקט  M×H — the market value of the work. This is what buys a
   *                  share of the rikma, and it is what the mission is *worth*.
   *   מלגת קיום       S×H — cash a partner pays so the person doing the work can
   *                  eat this month. It is deliberately far below the first
   *                  number, and it is not the price of the work.
   *
   * Showing them stacked, with the funder named, is also the honest answer to
   * §11.1: a fixed monthly payment computed from hours **looks** like a salary.
   * It is not one, and the card says so — the recipient is a partner receiving
   * a stipend, not an employee receiving wages. That framing has to be visible
   * at the moment someone considers taking the mission, not buried in terms.
   */
  import { t } from '$lib/translations';
  // This block is mounted on three very different hosts (a lev swiper card, the
  // offer page, the rikma's open board), each with its own background, so it
  // states its own ground and ink for all four appearance combinations rather
  // than inheriting whatever is behind it. See ./ui.js.
  import { SURFACE, ACCENT, MUTED, FAINT } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {number} hours
   * @property {number} perhour - the mission's market rate
   * @property {number} stipendRate - ₪ per approved hour of stipend
   * @property {number} [costShare] - α, to say who carries it
   * @property {string} [mode] - equity | advance | gift
   * @property {string} [funderName] - the member funding it, when there is one
   * @property {boolean} [monthly] - recurring mission: the figures are per cycle
   * @property {boolean} [compact]
   */

  /** @type {Props} */
  let {
    hours = 0,
    perhour = 0,
    stipendRate = 0,
    costShare = 1,
    mode = 'equity',
    funderName = '',
    monthly = false,
    compact = false
  } = $props();

  const investment = $derived(
    Math.round((Number(hours) || 0) * (Number(perhour) || 0))
  );
  const stipend = $derived(
    Math.round((Number(hours) || 0) * (Number(stipendRate) || 0))
  );
  const active = $derived(Number(stipendRate) > 0);
  const dilutes = $derived(mode === 'equity' && Number(costShare) < 1);

  const fmt = (/** @type {number} */ n) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 0 });
</script>

{#if active}
  <div class="stipend-offer {SURFACE}" class:compact>
    <p class="so-title {ACCENT}">💗 {$t('stipend.offer.title')}</p>

    <div class="so-lines">
      <div class="so-line">
        <span class="so-label {MUTED}">{$t('stipend.offer.investment')}</span>
        <span class="so-value">₪{fmt(investment)}</span>
        <span class="so-sub {FAINT}">
          {$t('stipend.offer.investmentSub', { count: fmt(perhour) })}
          {monthly ? $t('stipend.offer.perCycle') : ''}
        </span>
      </div>

      <div class="so-line">
        <span class="so-label {MUTED}">{$t('stipend.offer.stipend')}</span>
        <span class="so-value {ACCENT}">₪{fmt(stipend)}</span>
        <span class="so-sub {FAINT}">
          {$t('stipend.offer.stipendSub', { count: fmt(stipendRate) })}
          {monthly ? $t('stipend.offer.perCycle') : ''}
        </span>
      </div>
    </div>

    {#if funderName}
      <p class="so-funder text-sm font-bold">
        {$t('stipend.offer.funder', { name: funderName })}
      </p>
    {:else}
      <p class="so-funder {MUTED}">{$t('stipend.mission.seekingFunder')}</p>
    {/if}

    <p class={MUTED}>
      {mode === 'gift'
        ? $t('stipend.offer.noteGift')
        : dilutes
          ? $t('stipend.offer.noteRikma')
          : $t('stipend.offer.noteRecipient')}
    </p>

    <!-- §11.1. Not legal advice, and deliberately not hidden behind a link:
         a monthly sum computed from hours is the exact shape of a salary, and
         the difference here is real — a partner's stipend, not wages. -->
    <p class="so-legal {FAINT}">⚖️ {$t('stipend.offer.legal')}</p>
  </div>
{/if}

<style>
  /* Layout only. Every colour comes from the shared class set in ./ui.js, so
     the block follows the identity (gold ↔ blue) and the mode; the previous
     hard-coded teal ignored both. */
  .stipend-offer {
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .stipend-offer.compact {
    padding: 0.6rem 0.75rem;
    gap: 0.35rem;
  }
  .so-title {
    font-weight: 800;
    font-size: 0.95rem;
  }
  .so-lines {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .so-line {
    display: grid;
    grid-template-columns: auto auto;
    align-items: baseline;
    gap: 0.4rem 0.6rem;
  }
  .so-label {
    font-size: 0.9rem;
  }
  .so-value {
    font-size: 1.15rem;
    font-weight: 800;
    justify-self: end;
  }
  .so-sub {
    grid-column: 1 / -1;
  }
  .so-legal {
    border-top: 1px dashed currentColor;
    padding-top: 0.4rem;
  }
</style>
