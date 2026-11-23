<!--
  /join/supplier — "supplier in a minute" (docs/inprogress/PLAN_SUPPLIER_GROWTH.md SG1).

  Built for the supplier who arrives from a search and has never heard of a
  rikma. The page asks for one thing — a link or a sentence — and a service
  area, shows them their own card *before* any account, and only then asks for
  a name and an email. That saves the draft (/api/join/supplier → the same
  prepareSignup an agent uses) and sends them to the studio: the full review
  screen, editable, ending in sign-the-agreement-and-create. Nothing is created
  in their name before they sign there.
-->
<script>
  import { onMount } from 'svelte';
  import { t, locale, isRtl } from '$lib/translations';
  import { track } from '$lib/analytics/track.js';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import { previewProducts } from '$lib/assistant/supplierJoin';

  /** Same floor as /api/analyze-business. */
  const MIN_TEXT = 50;

  /** @type {'source' | 'loading' | 'preview' | 'saving'} */
  let step = $state('source');
  /** @type {'url' | 'text'} */
  let mode = $state('url');
  let url = $state('');
  let text = $state('');
  /** @type {import('$lib/components/location/LocationPicker.svelte').LocationValue} */
  let area = $state({ location_mode: 'unspecified', isOnline: false, lat: null, lng: null, radius: 15, location_hint: '' });
  let name = $state('');
  let email = $state('');
  let error = $state('');
  /** @type {any} */
  let analysis = $state(null);

  const normalizedUrl = $derived.by(() => {
    const u = url.trim();
    if (!u) return '';
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  });
  const urlOk = $derived(/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(normalizedUrl));
  const textOk = $derived(text.trim().length >= MIN_TEXT);
  const sourceOk = $derived(mode === 'url' ? urlOk : textOk);
  const emailOk = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
  const contactOk = $derived(name.trim().length > 0 && emailOk);

  const products = $derived(previewProducts(analysis?.blueprint));
  const moreCount = $derived.by(() => {
    const bp = analysis?.blueprint;
    if (!bp) return 0;
    const all = (bp.products?.length ?? 0) + (bp.missions?.length ?? 0) + (bp.resources?.length ?? 0);
    return Math.max(0, all - products.length);
  });

  onMount(() => track('supplier_entry', { entry: 'join' }));

  /** The picker's value as the endpoint's service area. */
  function serviceArea() {
    const online = area.location_mode === 'online' || !!area.isOnline;
    return {
      isOnline: online,
      lat: typeof area.lat === 'number' ? area.lat : null,
      lng: typeof area.lng === 'number' ? area.lng : null,
      radius: typeof area.radius === 'number' ? area.radius : null,
      hint: area.location_hint || null
    };
  }

  /** @param {number} status */
  function messageFor(status) {
    if (status === 429) return $t('supplierJoin.errors.rateLimited');
    return $t('supplierJoin.errors.analyze');
  }

  async function analyze() {
    if (!sourceOk || step === 'loading') return;
    error = '';
    step = 'loading';
    track('business_analyze', { entry: 'join', source: mode });
    try {
      const res = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'url' ? { url: normalizedUrl, lang: $locale } : { text: text.trim(), lang: $locale })
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && body?.ok !== false && !!body?.blueprint;
      track('business_analyzed', {
        entry: 'join',
        ok,
        reason: ok ? undefined : res.ok ? 'no_blueprint' : String(res.status),
        products: body?.blueprint?.products?.length ?? 0
      });
      if (!ok) {
        error = res.ok ? $t('supplierJoin.errors.analyze') : messageFor(res.status);
        step = 'source';
        return;
      }
      analysis = body;
      step = 'preview';
    } catch {
      track('business_analyzed', { entry: 'join', ok: false, reason: 'network' });
      error = $t('supplierJoin.errors.analyze');
      step = 'source';
    }
  }

  async function save() {
    if (!contactOk || step === 'saving' || !analysis?.blueprint) return;
    error = '';
    step = 'saving';
    try {
      const res = await fetch('/api/join/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          lang: $locale,
          sourceText: mode === 'url' ? normalizedUrl : text.trim(),
          blueprint: analysis.blueprint,
          area: serviceArea()
        })
      });
      const body = await res.json().catch(() => ({}));
      track('supplier_prepared', { ok: !!body?.ok });
      if (body?.ok && typeof body.next === 'string' && body.next.startsWith('/')) {
        window.location.assign(body.next);
        return;
      }
      if (body?.reason === 'signed-in') {
        window.location.assign('/onboard/business');
        return;
      }
      error = res.status === 429 ? $t('supplierJoin.errors.rateLimited') : $t('supplierJoin.errors.save');
      step = 'preview';
    } catch {
      track('supplier_prepared', { ok: false });
      error = $t('supplierJoin.errors.save');
      step = 'preview';
    }
  }

  function startOver() {
    analysis = null;
    error = '';
    step = 'source';
  }

  /** @param {number} n @param {string} [currency] */
  function price(n, currency) {
    try {
      return new Intl.NumberFormat($locale, { style: 'currency', currency: currency || 'ILS', maximumFractionDigits: 0 }).format(n);
    } catch {
      return String(n);
    }
  }
</script>

<svelte:head>
  <title>{$t('supplierJoin.meta.title')}</title>
  <meta name="description" content={$t('supplierJoin.meta.description')} />
  <meta property="og:title" content={$t('supplierJoin.meta.title')} />
  <meta property="og:description" content={$t('supplierJoin.meta.description')} />
</svelte:head>

<main class="sj" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="sj-hero">
    <p class="sj-kicker">{$t('supplierJoin.hero.kicker')}</p>
    <h1>{$t('supplierJoin.hero.title')}</h1>
    <p class="sj-sub">{$t('supplierJoin.hero.sub')}</p>
    <ul class="sj-promises">
      <li>{$t('supplierJoin.promises.p1')}</li>
      <li>{$t('supplierJoin.promises.p2')}</li>
      <li>{$t('supplierJoin.promises.p3')}</li>
    </ul>
  </header>

  <ol class="sj-steps" aria-label={$t('supplierJoin.steps.label')}>
    <li class:on={step === 'source' || step === 'loading'}>{$t('supplierJoin.steps.s1')}</li>
    <li class:on={step === 'preview' || step === 'saving'}>{$t('supplierJoin.steps.s2')}</li>
    <li>{$t('supplierJoin.steps.s3')}</li>
  </ol>

  <section class="sj-card" aria-live="polite">
    {#if step === 'source' || step === 'loading'}
      <div class="sj-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'url'} class:active={mode === 'url'} onclick={() => (mode = 'url')}>
          {$t('supplierJoin.form.tabUrl')}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'text'} class:active={mode === 'text'} onclick={() => (mode = 'text')}>
          {$t('supplierJoin.form.tabText')}
        </button>
      </div>

      {#if mode === 'url'}
        <label class="sj-label" for="sj-url">{$t('supplierJoin.form.urlLabel')}</label>
        <input id="sj-url" class="sj-input" type="url" dir="ltr" inputmode="url" autocomplete="url" placeholder="https://" bind:value={url} disabled={step === 'loading'} />
        <p class="sj-hint">{$t('supplierJoin.form.urlHint')}</p>
      {:else}
        <label class="sj-label" for="sj-text">{$t('supplierJoin.form.textLabel')}</label>
        <textarea id="sj-text" class="sj-input" rows="5" placeholder={$t('supplierJoin.form.textPlaceholder')} bind:value={text} disabled={step === 'loading'}></textarea>
        <p class="sj-hint" class:ok={textOk}>{$t('supplierJoin.form.textHint', { count: MIN_TEXT })}</p>
      {/if}

      <div class="sj-area">
        <LocationPicker bind:value={area} label={$t('supplierJoin.form.areaLabel')} helper={$t('supplierJoin.form.areaHelper')} height="300px" disabled={step === 'loading'} />
      </div>

      {#if error}<p class="sj-error" role="alert">{error}</p>{/if}

      <button type="button" class="sj-primary" disabled={!sourceOk || step === 'loading'} onclick={analyze}>
        {step === 'loading' ? $t('supplierJoin.loading.title') : $t('supplierJoin.form.submit')}
      </button>
      {#if step === 'loading'}
        <p class="sj-hint center">{$t('supplierJoin.loading.sub')}</p>
      {/if}
    {:else}
      <h2>{$t('supplierJoin.preview.title')}</h2>
      <article class="sj-preview">
        <h3>{analysis?.name}</h3>
        {#if analysis?.desc}<p>{analysis.desc}</p>{/if}
        {#if products.length}
          <h4>{$t('supplierJoin.preview.products')}</h4>
          <ul>
            {#each products as p (p.name)}
              <li><span>{p.name}</span>{#if typeof p.price === 'number'}<span class="sj-price">{price(p.price, p.currency)}</span>{/if}</li>
            {/each}
          </ul>
        {:else}
          <p class="sj-hint">{$t('supplierJoin.preview.noProducts')}</p>
        {/if}
        {#if moreCount > 0}
          <p class="sj-hint">{$t('supplierJoin.preview.more', { count: moreCount })}</p>
        {/if}
      </article>
      <button type="button" class="sj-link" onclick={startOver} disabled={step === 'saving'}>{$t('supplierJoin.preview.again')}</button>

      <h2>{$t('supplierJoin.contact.title')}</h2>
      <p class="sj-sub small">{$t('supplierJoin.contact.sub')}</p>
      <label class="sj-label" for="sj-name">{$t('supplierJoin.contact.name')}</label>
      <input id="sj-name" class="sj-input" autocomplete="name" bind:value={name} disabled={step === 'saving'} />
      <label class="sj-label" for="sj-email">{$t('supplierJoin.contact.email')}</label>
      <input id="sj-email" class="sj-input" type="email" dir="ltr" autocomplete="email" bind:value={email} disabled={step === 'saving'} />

      {#if error}<p class="sj-error" role="alert">{error}</p>{/if}

      <button type="button" class="sj-primary" disabled={!contactOk || step === 'saving'} onclick={save}>
        {$t('supplierJoin.contact.submit')}
      </button>
      <p class="sj-hint center">{$t('supplierJoin.contact.note')}</p>
    {/if}
  </section>
</main>

<style>
  .sj {
    --ivory: #fbf7ef;
    --paper: #fffdf8;
    --ink: #1f1620;
    --ink-soft: #5b4d57;
    --gold: #b0862b;
    --gold-soft: #e9d7a6;
    --rose: #b3124f;
    --line: rgba(176, 134, 43, 0.28);
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    /* Room under the card for the global mobile footer, which floats over the page. */
    padding: clamp(1.5rem, 5vw, 3.5rem) 1rem 8rem;
    background:
      radial-gradient(1000px 500px at 85% -10%, rgba(233, 215, 166, 0.45), transparent 60%),
      var(--ivory);
    color: var(--ink);
    font-family: 'Assistant', 'Rubik', system-ui, sans-serif;
    line-height: 1.6;
  }
  .sj h1,
  .sj h2,
  .sj h3,
  .sj h4 {
    margin: 0;
    background: none;
  }
  .sj p {
    margin: 0;
  }
  .sj-hero,
  .sj-steps,
  .sj-card {
    max-width: 640px;
    margin-inline: auto;
  }
  .sj-hero {
    text-align: center;
    display: grid;
    gap: 0.75rem;
  }
  .sj-kicker {
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--gold);
    font-size: 0.8rem;
    font-weight: 600;
  }
  .sj-hero h1 {
    font-family: 'Bellefair', 'Frank Ruhl Libre', Georgia, serif;
    font-weight: 400;
    font-size: clamp(2rem, 6vw, 3rem);
    line-height: 1.15;
  }
  .sj-sub {
    color: var(--ink-soft);
    font-size: 1.05rem;
  }
  .sj-sub.small {
    font-size: 0.95rem;
  }
  .sj-promises {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  .sj-promises li {
    border: 1px solid var(--line);
    background: var(--paper);
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    font-size: 0.9rem;
  }
  .sj-steps {
    list-style: none;
    padding: 0;
    margin-block: 1.75rem 1rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    counter-reset: step;
  }
  .sj-steps li {
    counter-increment: step;
    text-align: center;
    font-size: 0.85rem;
    color: var(--ink-soft);
    border-top: 3px solid var(--gold-soft);
    padding-top: 0.4rem;
  }
  .sj-steps li::before {
    content: counter(step) '. ';
  }
  .sj-steps li.on {
    color: var(--ink);
    font-weight: 600;
    border-color: var(--gold);
  }
  .sj-card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 1.25rem;
    padding: clamp(1rem, 4vw, 2rem);
    display: grid;
    gap: 0.6rem;
    box-shadow: 0 18px 40px -24px rgba(31, 22, 32, 0.35);
  }
  .sj-card h2 {
    font-size: 1.25rem;
    margin-top: 0.5rem;
  }
  .sj-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .sj-tabs button {
    border: 1px solid var(--line);
    background: var(--ivory);
    color: var(--ink);
    border-radius: 0.75rem;
    padding: 0.65rem;
    font-weight: 600;
    cursor: pointer;
  }
  .sj-tabs button.active {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .sj-label {
    font-weight: 600;
    font-size: 0.95rem;
    margin-top: 0.4rem;
  }
  .sj-input {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    padding: 0.7rem 0.85rem;
    background: #fff;
    color: var(--ink);
    font: inherit;
  }
  .sj-input:focus {
    outline: 2px solid var(--gold);
    outline-offset: 1px;
  }
  .sj-hint {
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
  .sj-hint.ok {
    color: #2f7a3e;
  }
  .sj-hint.center {
    text-align: center;
  }
  .sj-area {
    margin-top: 0.5rem;
  }
  .sj-error {
    color: var(--rose);
    font-weight: 600;
  }
  .sj-primary {
    margin-top: 0.75rem;
    border: none;
    border-radius: 0.9rem;
    padding: 0.9rem 1rem;
    background: var(--ink);
    color: var(--paper);
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
  }
  .sj-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .sj-link {
    justify-self: start;
    background: none;
    border: none;
    color: var(--gold);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }
  .sj-preview {
    border: 1px dashed var(--gold);
    border-radius: 1rem;
    padding: 1rem;
    display: grid;
    gap: 0.4rem;
    background: #fff;
  }
  .sj-preview h3 {
    font-size: 1.2rem;
  }
  .sj-preview h4 {
    font-size: 0.95rem;
    margin-top: 0.4rem;
  }
  .sj-preview ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.3rem;
  }
  .sj-preview li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    padding-bottom: 0.3rem;
  }
  .sj-price {
    color: var(--gold);
    font-weight: 600;
    white-space: nowrap;
  }
</style>
