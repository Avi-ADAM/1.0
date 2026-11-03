<!--
  DealOffersPanel — the parts of a deal still open in its rikma (QA_CONCIERGE_E2E C-19).

  The wish was closed with parts nobody had taken; they went on in the rikma as open
  missions / resources. Whoever takes one is added to the deal, so the customer signs each
  candidacy along with the rikma and the candidate. The customer sees an approve button
  per candidacy; members see the same list, read-only, so they know who still has to sign.
  There is no "no" here: someone who does not accept the terms talks it over.

  On a fixed price (PLAN_DEAL_PRICING_TRACKS P3) who takes a part is the rikma's business and
  adds nothing to what she pays — except a part she marked as work at her place (§3.4): there
  she approves who. The customer marks and unmarks a part here; everyone sees the mark.
-->
<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import type { DealOffersView, DealCandidacyView, DealOpenOfferView } from '$lib/sheirut/dealOffers';

  let {
    view,
    isCustomer,
    busyId = null,
    onSign,
    onTalk,
    onMark
  }: {
    view: DealOffersView;
    isCustomer: boolean;
    busyId?: string | null;
    onSign: (c: DealCandidacyView) => void;
    onTalk: () => void;
    /** The customer marks / unmarks a part as work at her place (fixed price only). */
    onMark?: (offer: DealOpenOfferView, atCustomer: boolean) => void;
  } = $props();

  // Her signature is asked for on every part at cost, and on a fixed price only where she
  // marked the part as work at her place.
  const signsFor = (offer: DealOpenOfferView) => isCustomer && (!view.fixed || offer.atCustomer);

  function waiting(c: DealCandidacyView): string {
    if (c.approvable) return $t('deals.offers.ready');
    if (c.clientsPending > 0 && !(isCustomer && !c.signedByViewer)) return $t('deals.offers.waitClients');
    // (on a fixed price clientsPending is 0 unless the part is hers to approve)
    if (!c.membersSigned) return $t('deals.offers.waitMembers');
    if (!c.candidateAgreed) return $t('deals.offers.waitCandidate');
    return '';
  }
</script>

<Panel title={$t('deals.offers.title')}>
  <p class="do-explain">
    {view.fixed
      ? isCustomer
        ? $t('deals.offers.explainCustomerFixed')
        : $t('deals.offers.explainMemberFixed')
      : isCustomer
        ? $t('deals.offers.explainCustomer')
        : $t('deals.offers.explainMember')}
  </p>

  <ul class="do-offers">
    {#each view.offers as offer (offer.kind + offer.offerId)}
      <li class="do-offer">
        <div class="do-name">
          {offer.name}
          {#if offer.atCustomer}<span class="do-chip home">{$t('deals.offers.atCustomer')}</span>{/if}
        </div>
        {#if view.fixed && isCustomer && onMark}
          <label class="do-mark">
            <input
              type="checkbox"
              checked={offer.atCustomer}
              disabled={busyId === 'mark' + offer.kind + offer.lineId}
              onchange={(e) => onMark(offer, (e.currentTarget as HTMLInputElement).checked)}
            />
            {$t('deals.offers.markAtCustomer')}
          </label>
        {/if}
        {#if offer.candidacies.length === 0}
          <p class="do-none">{$t('deals.offers.noCandidates')}</p>
        {:else}
          <ul class="do-cands">
            {#each offer.candidacies as c (c.side + c.id)}
              <li class="do-cand">
                <div class="do-who">
                  {#if c.candidatePic}<img src={c.candidatePic} alt="" class="do-pic" />{/if}
                  <span>{c.candidateName}</span>
                </div>
                <div class="do-terms">
                  <span>
                    {c.side === 'ask'
                      ? $t('deals.offers.hours', { amount: c.amount })
                      : $t('deals.offers.quantity', { amount: c.amount })}
                  </span>
                  {#if !view.fixed}<span class="do-adds">{$t('deals.offers.addsToDeal')} <Money amount={c.price} /></span>{/if}
                </div>
                <div class="do-actions">
                  {#if signsFor(offer) && !c.signedByViewer}
                    <button class="do-sign" disabled={busyId === c.side + c.id} onclick={() => onSign(c)}>
                      {busyId === c.side + c.id ? $t('deals.offers.signing') : $t('deals.offers.sign')}
                    </button>
                    <button class="do-talk" onclick={onTalk}>{$t('deals.offers.talk')}</button>
                  {:else if signsFor(offer)}
                    <span class="do-chip ok">{$t('deals.offers.signed')}</span>
                  {/if}
                  {#if waiting(c)}<span class="do-chip">{waiting(c)}</span>{/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</Panel>

<style>
  .do-explain { font-size: 12px; color: var(--gold); line-height: 1.5; margin: 0 0 12px; }
  .do-offers, .do-cands { list-style: none; margin: 0; padding: 0; }
  .do-offer { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .do-offer:last-child { border-bottom: none; }
  .do-name { font-size: 13px; font-weight: 700; color: var(--text); }
  .do-none { margin: 4px 0 0; font-size: 12px; color: var(--gold); }
  .do-cand { margin-top: 8px; padding: 8px 10px; border-radius: 10px; background: var(--s2); border: 1px solid var(--border); }
  .do-who { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--gold-l); }
  .do-pic { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
  .do-terms { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px; color: var(--gold); }
  .do-adds { font-weight: 700; color: var(--gold-l); }
  .do-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
  .do-sign {
    padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--gold), var(--gold-l)); color: #1a1408;
    font-weight: 800; font-size: 12px; font-family: inherit;
  }
  .do-sign:disabled { opacity: 0.6; cursor: wait; }
  .do-talk {
    padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: inherit;
    background: transparent; color: var(--gold-l); border: 1px solid var(--border-g);
  }
  .do-chip { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: var(--gold-d); color: var(--gold-l); }
  .do-chip.ok { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
  .do-chip.home { margin-inline-start: 6px; }
  .do-mark { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12px; color: var(--gold-l); cursor: pointer; }
</style>
