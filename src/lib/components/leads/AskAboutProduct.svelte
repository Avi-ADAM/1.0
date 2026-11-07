<script lang="ts">
  /**
   * "Ask about this product" (docs/inprogress/PLAN_LEADS.md §5.5, L4) — on a
   * public product page, for anyone: a guest who is not ready to sign up, or
   * a buyer who wants a price for a quantity. It becomes a lead of the rikma
   * that sells it, with this product attached, through `/api/leads/ask`.
   *
   * The consent line names both the rikma and 1lev1 (§9 risk 4: the person
   * agrees to a rikma, on a platform), and the exact words shown are what is
   * stored as `consentText`.
   */
  import { t } from '$lib/translations';

  let {
    productId,
    productName = '',
    rikmaName = '',
    lang = 'he',
    signedIn = false
  }: { productId: string; productName?: string; rikmaName?: string; lang?: string; signedIn?: boolean } = $props();

  let open = $state(false);
  let name = $state('');
  let phone = $state('');
  let email = $state('');
  let message = $state('');
  let website = $state('');
  let consent = $state(false);
  let busy = $state(false);
  let sent = $state(false);
  let error = $state('');

  // How they want to be reached. "On the site" only for someone signed in —
  // a guest has no account to be answered on.
  type Channel = 'site' | 'email' | 'phone' | 'whatsapp';
  let channels = $derived<Channel[]>(signedIn ? ['site', 'email', 'phone', 'whatsapp'] : ['email', 'phone', 'whatsapp']);
  let via = $state<Channel | null>(null);
  $effect(() => {
    if (via === null) via = signedIn ? 'site' : 'email';
  });
  let needsEmail = $derived(via === 'email');
  let needsPhone = $derived(via === 'phone' || via === 'whatsapp');

  let consentText = $derived($t('pages.gift.ask.consent', { rikma: rikmaName || $t('pages.gift.ask.theRikma') }));
  let canSend = $derived(
    name.trim().length > 0 &&
      consent &&
      !!via &&
      (!needsEmail || email.trim().length > 0) &&
      (!needsPhone || phone.trim().length > 0) &&
      (via === 'site' || phone.trim().length > 0 || email.trim().length > 0)
  );

  async function send(e: SubmitEvent) {
    e.preventDefault();
    if (!canSend || busy) return;
    busy = true;
    error = '';
    try {
      const res = await fetch('/api/leads/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          contactVia: via,
          website,
          consent,
          consentText,
          lang,
          sourceUrl: typeof location !== 'undefined' ? location.href : undefined
        })
      });
      if (res.ok) {
        sent = true;
        return;
      }
      error = res.status === 429 ? $t('pages.gift.ask.errTooMany') : res.status === 400 ? $t('pages.gift.ask.errInvalid') : $t('pages.gift.ask.errTryAgain');
    } catch {
      error = $t('pages.gift.ask.errTryAgain');
    } finally {
      busy = false;
    }
  }
</script>

<section class="ask" aria-labelledby="ask-title">
  {#if sent}
    <p class="ask-done" role="status">
      {$t(via === 'site' ? 'pages.gift.ask.doneSite' : 'pages.gift.ask.done', { rikma: rikmaName || $t('pages.gift.ask.theRikma') })}
    </p>
  {:else if !open}
    <button type="button" class="ask-open" onclick={() => (open = true)}>
      <span id="ask-title">{$t('pages.gift.ask.cta')}</span>
      <span class="ask-sub">{signedIn ? $t('pages.gift.ask.subSignedIn') : $t('pages.gift.ask.sub')}</span>
    </button>
  {:else}
    <form class="ask-form" onsubmit={send}>
      <h3 id="ask-title" class="ask-title">{$t('pages.gift.ask.title', { name: productName })}</h3>
      <label class="ask-field">
        <span>{$t('pages.gift.ask.name')}</span>
        <input bind:value={name} required maxlength="200" autocomplete="name" />
      </label>
      <fieldset class="ask-via">
        <legend>{$t('pages.gift.ask.viaLabel')}</legend>
        <div class="ask-via-options" role="group">
          {#each channels as c (c)}
            <button type="button" class="ask-chip" aria-pressed={via === c} onclick={() => (via = c)}>
              {$t(`pages.gift.ask.via.${c}`)}
            </button>
          {/each}
        </div>
        {#if via === 'site'}<p class="ask-hint">{$t('pages.gift.ask.viaSiteHint')}</p>{/if}
      </fieldset>
      <div class="ask-row">
        <label class="ask-field">
          <span>{$t('pages.gift.ask.phone')}{#if !needsPhone}<span class="ask-opt"> · {$t('pages.gift.ask.optional')}</span>{/if}</span>
          <input type="tel" bind:value={phone} maxlength="40" dir="ltr" autocomplete="tel" required={needsPhone} />
        </label>
        <label class="ask-field">
          <span>{$t('pages.gift.ask.email')}{#if !needsEmail}<span class="ask-opt"> · {$t('pages.gift.ask.optional')}</span>{/if}</span>
          <input type="email" bind:value={email} maxlength="200" dir="ltr" autocomplete="email" required={needsEmail} />
        </label>
      </div>
      <label class="ask-field">
        <span>{$t('pages.gift.ask.message')}</span>
        <textarea bind:value={message} maxlength="4000" rows="3" placeholder={$t('pages.gift.ask.messagePlaceholder')}></textarea>
      </label>
      <!-- left empty by people; bots fill it -->
      <input class="ask-hp" name="website" bind:value={website} tabindex="-1" autocomplete="off" aria-hidden="true" />
      <label class="ask-consent">
        <input type="checkbox" bind:checked={consent} required />
        <span>{consentText}</span>
      </label>
      {#if name.trim() && via !== 'site' && !phone.trim() && !email.trim()}<p class="ask-hint">{$t('pages.gift.ask.needContact')}</p>{/if}
      {#if error}<p class="ask-err" role="alert">{error}</p>{/if}
      <div class="ask-actions">
        <button type="submit" class="ask-send" disabled={!canSend || busy}>{$t('pages.gift.ask.send')}</button>
        <button type="button" class="ask-cancel" onclick={() => (open = false)}>{$t('pages.gift.ask.cancel')}</button>
      </div>
    </form>
  {/if}
</section>

<style>
  .ask {
    margin-top: 16px;
  }
  .ask-open {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    background: transparent;
    color: inherit;
    text-align: start;
    cursor: pointer;
    font-weight: 700;
  }
  .ask-sub {
    font-weight: 400;
    font-size: 13px;
    opacity: 0.75;
  }
  .ask-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  }
  .ask-title {
    margin: 0;
    font-size: 17px;
  }
  .ask-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
  }
  .ask-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .ask-field input,
  .ask-field textarea {
    min-height: 42px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .ask-via {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }
  .ask-via-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ask-chip {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .ask-chip[aria-pressed='true'] {
    background: var(--gold, #c9a227);
    border-color: var(--gold, #c9a227);
    color: #1a1a1a;
    font-weight: 700;
  }
  .ask-opt {
    opacity: 0.65;
  }
  .ask-hp {
    position: absolute;
    inset-inline-start: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .ask-consent {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 13px;
  }
  .ask-consent input {
    margin-top: 3px;
  }
  .ask-hint,
  .ask-err {
    margin: 0;
    font-size: 13px;
  }
  .ask-err {
    color: #c0392b;
  }
  .ask-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ask-send {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    border: 0;
    background: var(--gold, #c9a227);
    color: #1a1a1a;
    font-weight: 700;
    cursor: pointer;
  }
  .ask-send:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ask-cancel {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .ask-done {
    margin: 0;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    font-weight: 700;
  }
</style>
