<script lang="ts">
  /**
   * /offer/<key> — a direct offer as its recipient sees it (PLAN_DIRECT_OFFER §5.1).
   * A view and one decision: take it. What happens after is said before she clicks.
   */
  import '$lib/styles/concierge.css';
  import Money from '$lib/components/money/Money.svelte';
  import { t } from '$lib/translations';
  import { plainText } from '$lib/wish/plainText';

  let { data, form } = $props();

  const offer = $derived(data.state === 'open' ? data.offer : null);
  const next = $derived(`/offer/${data.key}`);
  const signupHref = $derived(`/hascama?intent=concierge&next=${encodeURIComponent(next)}`);
  const loginHref = $derived(`/login?from=${encodeURIComponent(next)}`);

  /** The provider wrote rich text; it is shown as text — nothing a provider writes runs here. */
  const plain = plainText;

  const day = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  let busy = $state(false);
</script>

<svelte:head>
  <title>{offer ? `${offer.name} · ${$t('directOffer.page.titleSuffix')}` : $t('directOffer.page.titleSuffix')}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="of" dir="auto">
  {#if offer}
    <header class="of-head">
      {#if offer.provider?.pic}
        <img class="of-pic" src={offer.provider.pic} alt="" />
      {:else}
        <span class="of-pic of-pic--empty" aria-hidden="true">{(offer.provider?.name || '·').slice(0, 2)}</span>
      {/if}
      <div>
        <p class="of-from">
          {$t('directOffer.page.from', { name: offer.provider?.name ?? '' })}
          {#if offer.projectName}<span class="of-proj">· {offer.projectName}</span>{/if}
        </p>
        <h1 class="of-title">{offer.name}</h1>
      </div>
    </header>

    {#if offer.longDes}
      <p class="of-desc">{plain(offer.longDes)}</p>
    {/if}

    <dl class="of-meta">
      {#if offer.startDate || offer.finnishDate}
        <div>
          <dt>{$t('directOffer.page.when')}</dt>
          <dd>{[day(offer.startDate), day(offer.finnishDate)].filter(Boolean).join(' – ')}</dd>
        </div>
      {/if}
      <div>
        <dt>{$t('directOffer.page.where')}</dt>
        <dd>{offer.isOnline ? $t('directOffer.page.online') : offer.locationHint || '—'}</dd>
      </div>
    </dl>

    <section class="of-lines" aria-labelledby="of-lines-h">
      <h2 id="of-lines-h">{$t('directOffer.page.parts')}</h2>
      <ul>
        {#each offer.lines as l, i (i)}
          <li>
            <span class="of-line-name">{l.name}</span>
            <span class="of-line-amt">
              {#if l.amount != null}
                {$t(l.kind === 'mission' ? 'directOffer.page.hours' : 'directOffer.page.qty', { count: l.amount })}
              {/if}
            </span>
            <span class="of-line-price">{#if l.price != null}<Money amount={l.price} />{/if}</span>
          </li>
        {/each}
      </ul>
      <p class="of-total">
        <span>{$t('directOffer.page.total')}</span>
        <b><Money amount={offer.total} /></b>
      </p>
    </section>

    <section class="of-next" aria-labelledby="of-next-h">
      <h2 id="of-next-h">{$t('directOffer.page.nextTitle')}</h2>
      <ol>
        <li>{$t('directOffer.page.next1')}</li>
        <li>{$t('directOffer.page.next2', { name: offer.provider?.name ?? '' })}</li>
        <li>{$t('directOffer.page.next3')}</li>
      </ol>
    </section>

    {#if form?.code}
      <p class="of-error" role="alert">
        {$t(`directOffer.page.err.${form.code}`) || $t('directOffer.page.err.FAILED')}
      </p>
    {/if}

    {#if data.own}
      <p class="of-note">{$t('directOffer.page.own')}</p>
    {:else if data.signedIn}
      {#if data.emailLocked}<p class="of-note">{$t('directOffer.page.locked')}</p>{/if}
      <form method="POST" action="?/claim" onsubmit={() => (busy = true)}>
        <button class="of-cta" type="submit" disabled={busy}>{busy ? '⏳' : $t('directOffer.page.take')}</button>
      </form>
    {:else}
      {#if data.emailLocked}<p class="of-note">{$t('directOffer.page.locked')}</p>{/if}
      <div class="of-actions">
        <a class="of-cta" href={signupHref}>{$t('directOffer.page.signup')}</a>
        <a class="of-ghost" href={loginHref}>{$t('directOffer.page.login')}</a>
      </div>
      <p class="of-small">{$t('directOffer.page.signupHint')}</p>
    {/if}
  {:else}
    <section class="of-state" role="status">
      <h1 class="of-title">{$t(`directOffer.page.state.${data.state}.title`)}</h1>
      <p>{$t(`directOffer.page.state.${data.state}.body`, { name: (data as any).providerName ?? '' })}</p>
      <a class="of-ghost" href="/">{$t('directOffer.page.home')}</a>
    </section>
  {/if}
</main>

<style>
  .of {
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 16px 96px;
    color: var(--cg-ink);
    background: var(--cg-bg);
    min-height: 100vh;
  }
  .of-head {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 18px;
  }
  .of-pic {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.35);
  }
  .of-pic--empty {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgb(var(--cg-gold-rgb) / 0.1);
    color: var(--cg-goldhi);
    font-weight: 700;
  }
  .of-from {
    margin: 0;
    font-size: 14px;
    color: var(--cg-goldhi);
  }
  .of-proj {
    color: var(--cg-muted);
  }
  .of-title {
    margin: 4px 0 0;
    font-size: 26px;
    line-height: 1.25;
  }
  .of-desc {
    margin: 0 0 18px;
    white-space: pre-line;
    line-height: 1.6;
    color: var(--cg-ink);
  }
  .of-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin: 0 0 22px;
  }
  .of-meta dt {
    font-size: 12px;
    color: var(--cg-muted);
  }
  .of-meta dd {
    margin: 2px 0 0;
    font-size: 15px;
  }
  .of-lines,
  .of-next {
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.2);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 18px;
  }
  .of-lines h2,
  .of-next h2 {
    margin: 0 0 10px;
    font-size: 15px;
    color: var(--cg-goldhi);
  }
  .of-lines ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .of-lines li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    font-size: 14px;
  }
  .of-line-amt {
    color: var(--cg-muted);
  }
  .of-total {
    display: flex;
    justify-content: space-between;
    margin: 10px 0 0;
    font-size: 16px;
  }
  .of-next ol {
    margin: 0;
    padding-inline-start: 20px;
    line-height: 1.7;
    font-size: 14px;
  }
  .of-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .of-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 10px 22px;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    text-decoration: none;
    color: var(--cg-on-cta);
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
  }
  .of-cta:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .of-ghost {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 10px 18px;
    border-radius: 14px;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.14 * var(--cg-fg-k)));
    color: var(--cg-ink);
    text-decoration: none;
  }
  .of-cta:focus-visible,
  .of-ghost:focus-visible {
    outline: 2px solid var(--cg-goldhi);
    outline-offset: 2px;
  }
  .of-note,
  .of-small {
    font-size: 13px;
    color: var(--cg-muted);
    line-height: 1.5;
  }
  .of-error {
    color: var(--cg-pink);
    font-size: 14px;
  }
  .of-state {
    text-align: center;
    padding-top: 40px;
  }
  .of-state p {
    color: var(--cg-muted);
    margin: 10px 0 24px;
  }
</style>
