<script lang="ts">
  /** The direct offers I wrote, newest first (PLAN_DIRECT_OFFER P3). */
  import { t } from '$lib/translations';

  let { data } = $props();

  const day = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };
</script>

<svelte:head>
  <title>{$t('directOffer.list.title')}</title>
</svelte:head>

<main class="ol">
  <a class="ol-back" href="/deals">← {$t('directOffer.list.back')}</a>
  <div class="ol-head">
    <h1>{$t('directOffer.list.title')}</h1>
    <a class="ol-new" href="/deals/offers/new">+ {$t('directOffer.list.new')}</a>
  </div>
  <p class="ol-intro">{$t('directOffer.list.intro')}</p>

  {#if !data.loadOk}
    <p class="ol-empty" role="alert">{$t('directOffer.list.loadFailed')}</p>
  {:else if data.offers.length === 0}
    <p class="ol-empty">{$t('directOffer.list.empty')}</p>
  {:else}
    <ul class="ol-list">
      {#each data.offers as o (o.id)}
        <li>
          <a href="/deals/offers/{o.id}">
            <span class="ol-name">{o.name}</span>
            <span class="ol-for">{$t('directOffer.list.for', { name: o.customerName || o.recipientHint })}</span>
            <span class="ol-state ol-state--{o.state}">
              {#if o.state === 'draft'}
                {$t(o.linkIssued ? 'directOffer.list.sent' : 'directOffer.list.draft')}
              {:else if o.state === 'claimed'}
                {$t('directOffer.list.claimed', { when: day(o.claimedAt) })}
              {:else}
                {$t('directOffer.list.closed')}
              {/if}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  .ol {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 16px 96px;
    color: var(--text);
  }
  .ol-back {
    color: var(--tm);
    font-size: 13px;
    text-decoration: none;
  }
  .ol-back:hover {
    color: var(--text);
  }
  .ol-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 18px 0 6px;
    flex-wrap: wrap;
  }
  .ol-head h1 {
    margin: 0;
    font-size: 24px;
  }
  .ol-new {
    padding: 9px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--gold-l), var(--pink));
    color: var(--s1);
    font-weight: 700;
    text-decoration: none;
  }
  .ol-intro {
    color: var(--tm);
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 20px;
  }
  .ol-empty {
    color: var(--tm);
  }
  .ol-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ol-list a {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--s1);
    border: 1px solid var(--border-g);
    color: inherit;
    text-decoration: none;
  }
  .ol-list a:hover,
  .ol-list a:focus-visible {
    border-color: var(--gold-l);
  }
  .ol-name {
    font-weight: 700;
  }
  .ol-for {
    grid-column: 1;
    color: var(--tm);
    font-size: 13px;
  }
  .ol-state {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--s2);
    color: var(--gold-l);
  }
  .ol-state--claimed {
    color: var(--text);
    background: var(--gold-d);
  }
  .ol-state--closed {
    color: var(--tm);
  }
</style>
