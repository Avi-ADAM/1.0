<script>
  /**
   * The one signup screen an agent prepares (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md
   * §5.3): the agreement and the password together, prefilled from what the
   * person told their agent — name, email, countries — and editable.
   *
   * The agent prepared the fields; the person signs, chooses the password and
   * later confirms their email. Nothing here is automatic:
   *   1. /api/assistant/agent-sign — the signature (the same signatory row
   *      /api/chezin creates, tied to the prepared session) and the cookies
   *      /signup reads;
   *   2. the ordinary /signup action, posted as a real form, so everything
   *      after it (the check-email page, the confirmation mail) is unchanged.
   *
   * The name reaches this screen from a link someone else may have made, so it
   * is escaped before it goes into the agreement's HTML.
   *
   * The extended agreement is optional here as it is on the ordinary /hascama,
   * and signed where it always is, on agreement.1lev1.com. The link carries a
   * way back to this very screen (the same token, plus a nonce), and the
   * agreement site returns with `full=<its signatory row>`. That row counts
   * only in the tab that left for it — the nonce is kept in this tab's
   * sessionStorage — so a link someone else builds with a row id in it signs
   * nothing; agent-sign then checks the row itself (extendedSignature.ts).
   */
  import { t, locale } from '$lib/translations';
  import MultiSelect from 'svelte-multiselect';
  import { SIGNUP_COUNTRIES } from '$lib/data/signupCountries.js';
  import { AGENT_INTENT, REG_INTENT_COOKIE } from '$lib/concierge/regIntent.js';
  import { onMount, tick, untrack } from 'svelte';

  /**
   * @typedef {{ id: number, label: string, heb: string }} Country
   * @typedef {{ name: string, email: string, countries: Country[], intent: string, lang: string }} Prefill
   */

  /** @type {{ token: string, prefill: Prefill, returned?: { full: string, xn: string } | null }} */
  let { token, prefill, returned = null } = $props();

  const labelOf = (/** @type {{ label: string, heb: string }} */ c) => ($locale === 'he' ? c.heb : c.label);

  // Initial values from the link; the person owns them from here on.
  let name = $state(untrack(() => prefill.name ?? ''));
  let email = $state(untrack(() => prefill.email ?? ''));
  /** @type {string[]} */
  let selected = $state(untrack(() => (prefill.countries ?? []).map(labelOf)));
  let agreed = $state(false);
  let password = $state('');
  let password2 = $state('');
  let busy = $state(false);
  let error = $state('');

  const EXTENDED_SITE = 'https://agreement.1lev1.com/hascama';
  const EXTENDED_KEY = 'agentExtended';
  // The row the extended signing made, once this tab is known to have left for it.
  /** @type {string | null} */
  let extendedId = $state(null);
  // Minted in the browser only: the way back is built from this tab's origin.
  let nonce = $state('');
  const tokenTag = untrack(() => token.slice(-24));

  onMount(() => {
    nonce = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    if (!returned) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(EXTENDED_KEY) ?? 'null');
      if (saved?.t !== tokenTag || saved?.n !== returned.xn) return;
      extendedId = returned.full;
      // What they had typed before leaving, not the agent's first draft.
      if (typeof saved.name === 'string') name = saved.name;
      if (typeof saved.email === 'string') email = saved.email;
      if (Array.isArray(saved.selected)) selected = saved.selected.filter((/** @type {unknown} */ v) => typeof v === 'string');
    } catch {
      // No storage, no claim: the short agreement is still right here.
    }
  });

  let extendedHref = $derived.by(() => {
    if (!nonce) return EXTENDED_SITE;
    const back = `${window.location.origin}/hascama?agent=${encodeURIComponent(token)}&xn=${nonce}`;
    const q = new URLSearchParams({ return: back, lang: $locale });
    if (name.trim()) q.set('name', name.trim());
    if (email.trim()) q.set('email', email.trim());
    if (selected.length) q.set('location', JSON.stringify(selected));
    return `${EXTENDED_SITE}?${q}`;
  });

  function goToExtended(/** @type {MouseEvent} */ e) {
    if (!nonce) return; // not hydrated yet: the plain link still opens the agreement
    e.preventDefault();
    try {
      sessionStorage.setItem(EXTENDED_KEY, JSON.stringify({ t: tokenTag, n: nonce, name, email, selected: [...selected] }));
    } catch {
      // Without storage the way back is not accepted; they can still read it.
    }
    window.location.assign(extendedHref);
  }

  function forgetExtended() {
    extendedId = null;
    try {
      sessionStorage.removeItem(EXTENDED_KEY);
    } catch {
      /* nothing kept */
    }
  }

  /** @type {HTMLFormElement | undefined} */
  let signupForm = $state();
  let fp = $state('');
  let con = $state('');

  const escapeHtml = (/** @type {string} */ s) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

  let safeName = $derived(escapeHtml(name.trim() || '___'));
  let passwordOk = $derived(password.length >= 8 && /[A-Z]/.test(password));

  function countryIds() {
    return selected
      .map((n) => SIGNUP_COUNTRIES.find((c) => c.heb === n || c.label === n)?.value)
      .filter((v) => typeof v === 'number');
  }

  async function submit(/** @type {SubmitEvent} */ e) {
    e.preventDefault();
    if (busy) return;
    error = '';
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return (error = $t('home.amana.agent.errors.fields'));
    if (!countryIds().length) return (error = $t('home.amana.errors.locationRequired'));
    if (!agreed && !extendedId) return (error = $t('home.amana.agent.errors.agreement'));
    if (!passwordOk) return (error = $t('home.amana.agent.errors.weak'));
    if (password !== password2) return (error = $t('home.amana.agent.errors.mismatch'));

    busy = true;
    try {
      const res = await fetch('/api/assistant/agent-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          t: token,
          name: name.trim(),
          email: email.trim(),
          countries: countryIds(),
          agreed: true,
          ...(extendedId ? { fullChezin: extendedId } : {})
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const reason = ['expired', 'fields', 'countries', 'agreement', 'extended', 'rate-limited'].includes(body?.reason) ? body.reason : 'failed';
        // A signature that did not check out: back to the short agreement.
        if (reason === 'extended') forgetExtended();
        error = $t(`home.amana.agent.errors.${reason}`);
        busy = false;
        return;
      }
      // After the email confirmation: continue into what was prepared.
      document.cookie = `${REG_INTENT_COOKIE}=${AGENT_INTENT}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      forgetExtended();
      fp = String(body.chezinId);
      con = (body.countries ?? countryIds()).join(',');
      // The ordinary signup action, as a real form post (its redirect is a page).
      await tick();
      signupForm?.submit();
    } catch {
      error = $t('home.amana.agent.errors.failed');
      busy = false;
    }
  }
</script>

<section class="agent-signup" dir="auto">
  <div class="card">
    <p class="banner" role="note">{$t('home.amana.agent.banner')}</p>
    {#if prefill.intent}
      <p class="intent">{$t(`home.amana.agent.intent.${prefill.intent}`)}</p>
    {/if}

    <form onsubmit={submit} novalidate>
      <label class="field">
        <span>{$t('home.amana.form.nameLabel')}</span>
        <input bind:value={name} autocomplete="name" required />
      </label>

      <div class="field">
        <span id="agent-countries">{$t('home.amana.form.locationLabel')}</span>
        <MultiSelect
          bind:selected
          id="agent-location"
          placeholder={$t('home.amana.form.locationPlaceholder')}
          options={SIGNUP_COUNTRIES.map(labelOf)}
        />
      </div>

      <label class="field">
        <span>{$t('home.amana.form.emailLabel')}</span>
        <input type="email" bind:value={email} autocomplete="email" dir="ltr" required />
      </label>

      <div class="agreement">
        <h2>{$t('home.amana.agreement.title')}</h2>
        {#if extendedId}
          <p class="signed" role="status"><span aria-hidden="true">✓</span> {$t('home.amana.agreedFull')}</p>
          <p class="ext-note">{$t('home.amana.agent.extended.back')}</p>
        {:else}
          <p>
            {@html $t('home.amana.agreement.basicText1', { name: safeName })}
            <br />
            {@html $t('home.amana.agreement.basicText2', { name: safeName })}
          </p>
          <label class="check">
            <input type="checkbox" bind:checked={agreed} />
            <span>{$t('home.amana.agreement.checkboxLabel')}</span>
          </label>

          <div class="extended">
            <strong class="ext-title">{$t('home.amana.agreement.infoTitle')}</strong>
            <ul>
              <li>{@html $t('home.amana.agreement.basicInfo')}</li>
              <li>
                <a href={extendedHref} onclick={goToExtended}>{@html $t('home.amana.agreement.fullAgreementLink')}</a
                >{$t('home.amana.agreement.fullAgreementDesc')}
              </li>
            </ul>
            <p class="ext-note">{$t('home.amana.agent.extended.optional')}</p>
            <a class="ext-btn" href={extendedHref} onclick={goToExtended}>{$t('home.amana.agreement.fullButton')}</a>
          </div>
        {/if}
      </div>

      <label class="field">
        <span>{$t('home.amana.agent.password')}</span>
        <input type="password" bind:value={password} autocomplete="new-password" dir="ltr" required />
        <small class:ok={passwordOk}>{$t('home.amana.agent.passwordRule')}</small>
      </label>
      <label class="field">
        <span>{$t('home.amana.agent.password2')}</span>
        <input type="password" bind:value={password2} autocomplete="new-password" dir="ltr" required />
      </label>

      {#if error}<p class="error" role="alert">{error}</p>{/if}

      <button class="submit" type="submit" disabled={busy}>
        {busy ? $t('home.amana.agent.sending') : $t('home.amana.agent.submit')}
      </button>
      <p class="fine">{$t('home.amana.agent.fine')}</p>
    </form>

    <!-- The ordinary /signup action, filled once the signature is in. -->
    <form bind:this={signupForm} method="POST" action="/signup?fp={encodeURIComponent(fp)}&con={encodeURIComponent(con)}" hidden>
      <input type="hidden" name="email" value={email.trim().toLowerCase()} />
      <input type="hidden" name="password" value={password} />
      <input type="hidden" name="displayName" value={name.trim()} />
    </form>
  </div>
</section>

<style>
  .agent-signup {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 1.5rem 1rem 3rem;
    font-family: 'Rubik', sans-serif;
  }
  .card {
    width: min(560px, 100%);
    background: rgba(26, 10, 46, 0.92);
    color: #fff;
    border: 1px solid rgba(255, 215, 0, 0.4);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  }
  .banner {
    margin: 0 0 0.5rem;
    padding: 0.6rem 0.8rem;
    border-radius: 12px;
    background: rgba(255, 215, 0, 0.12);
    border: 1px solid rgba(255, 215, 0, 0.5);
    color: #ffd700;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .intent {
    margin: 0 0 1rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.85);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.9rem;
  }
  .field input {
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .field small {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
  }
  .field small.ok {
    color: #5be2a9;
  }
  .agreement {
    padding: 0.9rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 0, 174, 0.35);
  }
  .agreement h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: #ffd700;
  }
  .agreement p {
    margin: 0 0 0.6rem;
    line-height: 1.6;
    font-size: 0.9rem;
  }
  .signed {
    margin: 0 0 0.35rem;
    font-weight: 700;
    color: #5be2a9;
  }
  .extended {
    margin-top: 0.8rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 0.85rem;
  }
  .ext-title {
    color: #ffd700;
  }
  .extended ul {
    margin: 0.35rem 0 0.5rem;
    padding-inline-start: 1.2rem;
    line-height: 1.55;
  }
  .extended a {
    color: #ffd700;
  }
  .ext-note {
    margin: 0 0 0.6rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
  }
  .ext-btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 215, 0, 0.6);
    text-decoration: none;
    font-weight: 600;
  }
  .ext-btn:hover,
  .ext-btn:focus-visible {
    background: rgba(255, 215, 0, 0.12);
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    font-size: 0.9rem;
  }
  .error {
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.5);
    font-size: 0.85rem;
  }
  .submit {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 0;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }
  .submit:disabled {
    opacity: 0.7;
    cursor: default;
  }
  .fine {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.65);
  }
</style>
