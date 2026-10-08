<script lang="ts">
  /** One direct offer, as its provider manages it (PLAN_DIRECT_OFFER P3–P4). */
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  import WishTermsEditor from '$lib/components/concierge/WishTermsEditor.svelte';
  import { plainText } from '$lib/wish/plainText';

  let { data } = $props();
  const o = $derived(data.offer);
  const link = $derived(data.linkPath ? `${page.url.origin}${data.linkPath}` : '');
  const whatsapp = $derived(
    link ? `https://wa.me/?text=${encodeURIComponent($t('directOffer.manage.shareText', { name: o.name }) + '\n' + link)}` : ''
  );

  let busy = $state<string | null>(null);
  let recipientOpen = $state(false);
  let recipientHint = $state('');
  let recipientEmail = $state('');

  async function act(actionKey: string, params: Record<string, unknown>, ok: string) {
    if (busy) return null;
    busy = actionKey;
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey, params: { ratsonId: o.id, ...params } })
      });
      const out = await res.json();
      if (!out?.success) throw new Error(out?.error?.message || 'failed');
      toast.success($t(ok));
      await invalidateAll();
      return out.data;
    } catch (err) {
      console.error(`[deals/offers/[id]] ${actionKey} failed:`, err);
      toast.error($t('directOffer.manage.failed'));
      return null;
    } finally {
      busy = null;
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success($t('directOffer.manage.copied'));
    } catch {
      toast.error($t('directOffer.manage.copyFailed'));
    }
  }

  function openRecipient() {
    recipientHint = o.recipientHint ?? '';
    recipientEmail = '';
    recipientOpen = true;
  }

  async function saveRecipient(e: SubmitEvent) {
    e.preventDefault();
    const params: Record<string, unknown> = { recipientHint: recipientHint.trim() };
    // Empty leaves the lock as it is; the explicit button below removes it.
    if (recipientEmail.trim()) params.recipientEmail = recipientEmail.trim();
    if (await act('updateDirectOffer', params, 'directOffer.manage.saved')) recipientOpen = false;
  }

  const day = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };
</script>

<svelte:head>
  <title>{o.name} · {$t('directOffer.list.title')}</title>
</svelte:head>

<main class="om">
  <a class="om-back" href="/deals/offers">← {$t('directOffer.manage.back')}</a>

  <header class="om-head">
    <h1>{o.name}</h1>
    <p class="om-for">{$t('directOffer.list.for', { name: o.recipientHint ?? '' })}</p>
    <span class="om-state om-state--{o.state}">
      {#if o.state === 'draft'}
        {$t(o.linkAt ? 'directOffer.list.sent' : 'directOffer.list.draft')}
      {:else if o.state === 'claimed'}
        {$t('directOffer.list.claimed', { when: day(o.claimedAt) })}
      {:else}
        {$t('directOffer.list.closed')}
      {/if}
    </span>
  </header>

  {#if o.state === 'draft'}
    <section class="om-box" aria-labelledby="om-link-h">
      <h2 id="om-link-h">{$t('directOffer.manage.linkTitle')}</h2>
      {#if link}
        <p class="om-hint">{$t('directOffer.manage.linkHint')}</p>
        <div class="om-link">
          <input type="text" readonly value={link} aria-label={$t('directOffer.manage.linkTitle')} onfocus={(e) => e.currentTarget.select()} />
          <button type="button" onclick={copy}>{$t('directOffer.manage.copy')}</button>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">{$t('directOffer.manage.whatsapp')}</a>
        </div>
        <div class="om-row">
          <button type="button" class="om-ghost" disabled={!!busy} onclick={() => act('issueDirectOfferLink', {}, 'directOffer.manage.linkReplaced')}>
            {$t('directOffer.manage.newLink')}
          </button>
          <button type="button" class="om-ghost" disabled={!!busy} onclick={() => act('revokeDirectOfferLink', {}, 'directOffer.manage.linkClosed')}>
            {$t('directOffer.manage.closeLink')}
          </button>
        </div>
        <p class="om-small">{$t('directOffer.manage.newLinkHint')}</p>
      {:else}
        <p class="om-hint">{$t('directOffer.manage.noLink')}</p>
        <button type="button" class="om-cta" disabled={!!busy} onclick={() => act('issueDirectOfferLink', {}, 'directOffer.manage.linkMade')}>
          {busy === 'issueDirectOfferLink' ? '⏳' : $t('directOffer.manage.makeLink')}
        </button>
      {/if}
    </section>

    <section class="om-box" aria-labelledby="om-who-h">
      <h2 id="om-who-h">{$t('directOffer.compose.forWhom')}</h2>
      <p>
        {o.recipientHint}
        · {$t(o.emailLocked ? 'directOffer.manage.locked' : 'directOffer.manage.unlocked')}
      </p>
      {#if recipientOpen}
        <form class="om-form" onsubmit={saveRecipient}>
          <label>
            {$t('directOffer.compose.recipient')}
            <input type="text" bind:value={recipientHint} maxlength="120" required />
          </label>
          <label>
            {$t('directOffer.compose.email')}
            <input type="email" bind:value={recipientEmail} maxlength="200" autocomplete="off" />
            <small>{$t('directOffer.manage.emailReplaceHint')}</small>
          </label>
          <div class="om-row">
            <button type="submit" class="om-cta" disabled={!!busy}>{$t('directOffer.manage.save')}</button>
            {#if o.emailLocked}
              <button type="button" class="om-ghost" disabled={!!busy} onclick={() => act('updateDirectOffer', { recipientEmail: '' }, 'directOffer.manage.unlockedToast')}>
                {$t('directOffer.manage.unlock')}
              </button>
            {/if}
            <button type="button" class="om-ghost" onclick={() => (recipientOpen = false)}>{$t('directOffer.manage.cancel')}</button>
          </div>
        </form>
      {:else}
        <button type="button" class="om-ghost" onclick={openRecipient}>{$t('directOffer.manage.editRecipient')}</button>
      {/if}
    </section>
  {:else if o.state === 'claimed'}
    <section class="om-box">
      <p>{$t('directOffer.manage.claimedBody')}</p>
      <div class="om-row">
        <a class="om-cta" href="/deals">{$t('directOffer.manage.toDeals')}</a>
        <a class="om-ghost" href="/wish/{o.id}">{$t('directOffer.manage.toWish')}</a>
      </div>
    </section>
  {/if}

  <section class="om-box" aria-labelledby="om-what-h">
    <h2 id="om-what-h">{$t('directOffer.compose.what')}</h2>
    {#if o.longDes}<p class="om-desc">{plainText(o.longDes)}</p>{/if}
    <p class="om-meta">
      {#if o.startDate || o.finnishDate}{[day(o.startDate), day(o.finnishDate)].filter(Boolean).join(' – ')} · {/if}
      {o.isOnline ? $t('directOffer.page.online') : o.locationHint || '—'}
    </p>
    {#if o.state === 'draft'}
      <WishTermsEditor
        wish={{ id: o.id, name: o.name, longDes: o.longDes, startDate: o.startDate, finnishDate: o.finnishDate, isOnline: o.isOnline, locationHint: o.locationHint }}
        actionKey="updateDirectOffer"
        noteKey="directOffer.manage.termsNote"
      />
    {/if}
  </section>

  <section class="om-box" aria-labelledby="om-parts-h">
    <h2 id="om-parts-h">{$t('directOffer.compose.parts')}</h2>
    <ul class="om-lines">
      {#each o.lines as l (l.lineId)}
        <li>
          <span>{l.name}</span>
          <span class="om-amt">
            {#if l.amount != null}{$t(l.kind === 'mission' ? 'directOffer.page.hours' : 'directOffer.page.qty', { count: l.amount })}{/if}
          </span>
          <span>{#if l.price != null}<Money amount={l.price} />{/if}</span>
        </li>
      {/each}
    </ul>
    <p class="om-total"><span>{$t('directOffer.page.total')}</span><b><Money amount={o.total} /></b></p>
    {#if o.state === 'draft'}<p class="om-small">{$t('directOffer.manage.partsFixed')}</p>{/if}
  </section>
</main>

<style>
  .om {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 16px 96px;
    color: var(--text);
  }
  .om-back {
    color: var(--tm);
    font-size: 13px;
    text-decoration: none;
  }
  .om-head {
    margin: 18px 0 16px;
  }
  .om-head h1 {
    margin: 0;
    font-size: 24px;
  }
  .om-for {
    margin: 4px 0 8px;
    color: var(--tm);
  }
  .om-state {
    display: inline-block;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--s2);
    color: var(--gold-l);
  }
  .om-box {
    background: var(--s1);
    border: 1px solid var(--border-g);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }
  .om-box h2 {
    margin: 0 0 8px;
    font-size: 16px;
    color: var(--gold-l);
  }
  .om-hint,
  .om-small,
  .om-meta {
    color: var(--tm);
    font-size: 13px;
    line-height: 1.6;
  }
  .om-desc {
    white-space: pre-line;
    line-height: 1.6;
  }
  .om-link {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
  }
  .om-link input {
    flex: 1 1 260px;
    min-width: 0;
    direction: ltr;
  }
  .om-link button,
  .om-link a {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid var(--border-g);
    background: var(--s2);
    color: var(--gold-l);
    text-decoration: none;
    cursor: pointer;
    font-size: 14px;
  }
  .om-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .om-cta {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 8px 18px;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    color: var(--s1);
    background: linear-gradient(135deg, var(--gold-l), var(--pink));
  }
  .om-ghost {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 1px solid var(--border-g);
    background: none;
    color: var(--text);
    text-decoration: none;
    cursor: pointer;
  }
  .om-cta:disabled,
  .om-ghost:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .om-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .om-form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--tm);
  }
  input[type='text'],
  input[type='email'] {
    background: var(--s2);
    color: var(--text);
    border: 1px solid var(--border-g);
    border-radius: 8px;
    padding: 8px 10px;
    font: inherit;
    font-size: 14px;
  }
  input:focus-visible,
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--gold-l);
    outline-offset: 2px;
  }
  .om-lines {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .om-lines li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  .om-amt {
    color: var(--tm);
  }
  .om-total {
    display: flex;
    justify-content: space-between;
    margin: 10px 0 0;
  }
</style>
