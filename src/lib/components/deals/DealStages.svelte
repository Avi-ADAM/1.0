<script lang="ts">
  /**
   * The deal's stages — shaping → approval → carrying out → closed — on every page
   * that shows one of them (docs/inprogress/PLAN_DIRECT_OFFER.md §7.2, P1). Each stage that
   * happened opens its own page. The stages come from `readDealStages` on the server.
   *
   * Two skins: `deals` paints with the deals pages' tokens (--s2, --gold-l, …), and
   * `concierge` with the concierge palette (--cg-*), where it takes the place of the
   * wish page's step dial.
   */
  import { t } from '$lib/translations';
  import type { DealStageView } from '$lib/sheirut/dealChain';

  let { stages = [], variant = 'deals' }: { stages?: DealStageView[]; variant?: 'deals' | 'concierge' } = $props();
</script>

{#if stages.length > 0}
  <nav class="ds ds-{variant}" aria-label={$t('deals.stages.label')}>
    <ol>
      {#each stages as s, i (s.key)}
        <li class="st" class:reached={s.reached} class:active={s.active} class:here={s.here}>
          {#if i > 0}<span class="sep" aria-hidden="true"></span>{/if}
          {#snippet body()}
            <span class="dot" aria-hidden="true">{s.reached && !s.active ? '✓' : i + 1}</span>
            <span class="lbl">{$t(`deals.stages.${s.key}`)}</span>
            {#if s.count > 1}
              <span class="cnt" title={$t('deals.stages.count', { count: s.count })}>{s.count}</span>
            {/if}
          {/snippet}
          {#if s.href}
            <a class="in" href={s.href}>{@render body()}</a>
          {:else}
            <span class="in" aria-current={s.here ? 'step' : undefined}>{@render body()}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}

<style>
  .ds ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .st {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .in {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px 3px 4px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 12px;
    text-decoration: none;
    color: inherit;
  }
  a.in:hover,
  a.in:focus-visible {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .cnt {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
  }
  .sep {
    width: 18px;
    height: 1px;
    flex-shrink: 0;
  }

  /* ── deals skin ── */
  .ds-deals {
    margin: 0 0 18px;
  }
  .ds-deals .st {
    color: var(--tm);
  }
  .ds-deals .dot {
    background: var(--s2);
    border: 1px solid var(--border-g);
    color: var(--tm);
  }
  .ds-deals .sep {
    background: var(--border-g);
  }
  .ds-deals .st.reached {
    color: var(--gold-l);
  }
  .ds-deals .st.reached .dot {
    background: var(--gold-d);
    color: var(--gold-l);
  }
  .ds-deals .st.active .dot {
    background: linear-gradient(135deg, var(--gold-l), var(--pink));
    color: var(--s1);
    border-color: transparent;
  }
  .ds-deals .st.active {
    color: var(--text);
  }
  .ds-deals .st.here .in {
    border-color: var(--border-g);
    background: var(--s2);
  }
  .ds-deals .cnt {
    background: var(--pink-d);
    color: var(--pink-l);
  }

  /* ── concierge skin (the wish page's step dial) ── */
  .ds-concierge .st {
    color: var(--cg-dim);
    font-family: 'Bellefair', serif;
  }
  .ds-concierge .in {
    font-size: 13px;
  }
  .ds-concierge .dot {
    font-family: 'Cinzel', serif;
    background: rgb(var(--cg-fg-rgb) / calc(0.04 * var(--cg-fg-k)));
    color: var(--cg-dim);
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
  }
  .ds-concierge .sep {
    background: rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
  }
  .ds-concierge .st.reached {
    color: var(--cg-mint);
  }
  .ds-concierge .st.reached .dot {
    background: rgb(var(--cg-mint-rgb) / 0.12);
    color: var(--cg-mint);
    border-color: rgb(var(--cg-mint-rgb) / 0.4);
  }
  .ds-concierge .st.active {
    color: var(--cg-pink);
  }
  .ds-concierge .st.active .dot {
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    color: var(--cg-on-cta);
    border-color: rgb(var(--cg-pink-rgb) / 0.5);
    box-shadow: 0 0 18px rgb(var(--cg-pink-rgb) / 0.5);
  }
  .ds-concierge .st.here .in {
    border-color: rgb(var(--cg-gold-rgb) / 0.3);
    background: rgb(var(--cg-gold-rgb) / 0.06);
  }
  .ds-concierge .cnt {
    background: rgb(var(--cg-pink-rgb) / 0.15);
    color: var(--cg-pink);
  }
</style>
