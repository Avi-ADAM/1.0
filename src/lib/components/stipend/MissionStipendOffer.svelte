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

  const investment = $derived(Math.round((Number(hours) || 0) * (Number(perhour) || 0)));
  const stipend = $derived(Math.round((Number(hours) || 0) * (Number(stipendRate) || 0)));
  const active = $derived(Number(stipendRate) > 0);
  const dilutes = $derived(mode === 'equity' && Number(costShare) < 1);

  const fmt = (/** @type {number} */ n) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
</script>

{#if active}
  <div class="stipend-offer" class:compact>
    <p class="so-title">💗 {$t('stipend.offer.title')}</p>

    <div class="so-lines">
      <div class="so-line">
        <span class="so-label">{$t('stipend.offer.investment')}</span>
        <span class="so-value">₪{fmt(investment)}</span>
        <span class="so-sub">
          {$t('stipend.offer.investmentSub', { count: fmt(perhour) })}
          {monthly ? $t('stipend.offer.perCycle') : ''}
        </span>
      </div>

      <div class="so-line so-line-stipend">
        <span class="so-label">{$t('stipend.offer.stipend')}</span>
        <span class="so-value">₪{fmt(stipend)}</span>
        <span class="so-sub">
          {$t('stipend.offer.stipendSub', { count: fmt(stipendRate) })}
          {monthly ? $t('stipend.offer.perCycle') : ''}
        </span>
      </div>
    </div>

    {#if funderName}
      <p class="so-funder">{$t('stipend.offer.funder', { name: funderName })}</p>
    {:else}
      <p class="so-funder so-seeking">{$t('stipend.mission.seekingFunder')}</p>
    {/if}

    <p class="so-note">
      {mode === 'gift'
        ? $t('stipend.offer.noteGift')
        : dilutes
          ? $t('stipend.offer.noteRikma')
          : $t('stipend.offer.noteRecipient')}
    </p>

    <!-- §11.1. Not legal advice, and deliberately not hidden behind a link:
         a monthly sum computed from hours is the exact shape of a salary, and
         the difference here is real — a partner's stipend, not wages. -->
    <p class="so-legal">⚖️ {$t('stipend.offer.legal')}</p>
  </div>
{/if}

<style>
  .stipend-offer {
    border: 1px solid rgba(20, 184, 166, 0.5);
    border-radius: 0.9rem;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(20, 184, 166, 0.06);
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
    opacity: 0.85;
  }
  .so-value {
    font-size: 1.15rem;
    font-weight: 800;
    justify-self: end;
  }
  .so-line-stipend .so-value {
    color: rgb(13, 148, 136);
  }
  :global(.dark) .so-line-stipend .so-value {
    color: rgb(94, 234, 212);
  }
  .so-sub {
    grid-column: 1 / -1;
    font-size: 0.75rem;
    opacity: 0.65;
  }
  .so-funder {
    font-size: 0.8rem;
    font-weight: 700;
  }
  .so-seeking {
    font-weight: 400;
    opacity: 0.75;
  }
  .so-note {
    font-size: 0.75rem;
    opacity: 0.75;
  }
  .so-legal {
    font-size: 0.72rem;
    opacity: 0.7;
    border-top: 1px dashed rgba(128, 128, 128, 0.4);
    padding-top: 0.4rem;
  }
</style>
