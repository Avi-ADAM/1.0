<script>
  /**
   * A rikma event's landing page (docs/inprogress/PLAN_EVENTS_WEBINARS.md §3.1):
   * hero → what you get → who it is for → agenda → hosts → pick a date + form
   * → questions → a last call. Registration posts to the public endpoint and
   * moves the visitor to their own page, /e/<token>.
   */
  import { goto } from '$app/navigation';
  import { t, locale, isRtl } from '$lib/translations';
  import RikmaSkin from '$lib/components/rikmaPublic/RikmaSkin.svelte';
  import { shownLook } from '$lib/rikmaLook/frame.svelte';
  import Translated from '$lib/components/ui/Translated.svelte';
  import TranslatedNote from '$lib/components/ui/TranslatedNote.svelte';
  import { pageTranslations } from '$lib/translation/pageTranslations.svelte';
  import { paragraphs } from '$lib/events/model';

  let { data } = $props();

  let event = $derived(data.event);
  // UGC translation (W4): the loader's one cache read; a miss renders the
  // member's own words. Every string below is one the loader hashed through
  // `eventPageGroups` — the same paragraphs and lines, or nothing is found.
  const tr = pageTranslations(() => data, () => $locale);
  let paras = $derived(paragraphs(event.description));
  let look = $derived(shownLook(data.look ?? null));
  let open = $derived(data.sessions.filter((s) => s.open));
  /** @type {'rtl' | 'ltr'} */
  let dir = $derived($isRtl ? 'rtl' : 'ltr');

  /** The count shows only past a threshold — "3 registered" works against the page. */
  const SOCIAL_PROOF_MIN = 10;

  let sessionKey = $state('');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let website = $state(''); // honeypot
  let consent = $state(false);
  /** @type {Record<string, string | boolean>} */
  let answers = $state({});
  let busy = $state(false);
  let problem = $state('');

  $effect(() => {
    if (!sessionKey && open.length > 0) sessionKey = open[0].key;
  });

  function fmtDate(iso, tz) {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: tz || undefined
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  }
  function fmtTime(iso, tz) {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz || undefined
      }).format(new Date(iso));
    } catch {
      return '';
    }
  }
  /** The visitor's own clock, when it differs from the event's. */
  function localTime(iso, tz) {
    const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || here === tz) return '';
    return fmtTime(iso, here);
  }

  let next = $derived(open[0] ?? null);
  let soon = $derived(next && Date.parse(next.startsAt) - Date.now() < 48 * 3600_000);
  let totalMinutes = $derived(event.agenda.reduce((a, i) => a + (i.minutes ?? 0), 0));

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    problem = '';
    if (open.length > 0 && !sessionKey) {
      problem = 'session';
      return;
    }
    if (!consent) {
      problem = 'consent';
      return;
    }
    busy = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const utm = {};
      for (const k of ['source', 'medium', 'campaign', 'term', 'content']) {
        const v = params.get(`utm_${k}`);
        if (v) utm[k] = v;
      }
      const res = await fetch(data.registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          sessionKey: open.length > 0 ? sessionKey : null,
          answers,
          consent,
          website,
          lang: $locale,
          sourceUrl: window.location.href,
          ref: params.get('ref'),
          utm
        })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.token) {
        await goto(`/e/${body.token}?new=1`);
        return;
      }
      problem = body?.problem || body?.code || 'error';
    } catch {
      problem = 'error';
    } finally {
      busy = false;
    }
  }

  const scrollToForm = () => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
</script>

<svelte:head>
  <title>{event.title} · {data.rikma.name || '1💗1'}</title>
  <meta name="description" content={event.tagline ?? event.description?.slice(0, 160) ?? ''} />
  <meta property="og:title" content={event.title} />
  <meta property="og:description" content={event.tagline ?? ''} />
  <meta property="og:type" content="website" />
  {#if event.cover}<meta property="og:image" content={event.cover} />{/if}
  <link rel="canonical" href={data.canonical} />
  {#if data.preview}<meta name="robots" content="noindex" />{/if}
</svelte:head>

<RikmaSkin {look}>
  <div class="event-page min-h-screen text-white font-sans overflow-x-hidden" {dir}>
    {#if data.preview}
      <div class="bg-gold text-black text-center text-sm font-semibold py-2 px-4">
        {$t(event.status === 'proposed' ? 'events.page.previewProposed' : 'events.page.previewDraft')}
      </div>
    {/if}

    <!-- 1. Hero -->
    <section class="max-w-4xl mx-auto px-4 pt-12 pb-10 text-center">
      <a href={`/r/${data.rikma.slug ?? data.rikma.id}`} class="text-white/60 text-sm hover:text-gold"><Translated text={data.rikma.name} hit={tr.hitFor(data.rikma.name)} showNote={false} /></a>
      <p class="mt-3 text-xs uppercase tracking-widest text-gold/80">{$t(`events.kind.${event.kind}`)}</p>
      <h1 class="mt-2 text-3xl sm:text-5xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-l from-gold via-white to-barbi">
        <Translated text={event.title} hit={tr.hitFor(event.title)} showNote={false} />
      </h1>
      <!-- One provenance line for the hero's title and the rikma's name. -->
      <TranslatedNote hit={tr.firstReal(event.title, data.rikma.name)} class="mt-1" />
      {#if event.tagline}
        <Translated as="p" class="mt-4 text-lg text-white/80 max-w-2xl mx-auto" text={event.tagline} hit={tr.hitFor(event.tagline)} />
      {/if}
      {#if next}
        <p class="mt-6 text-white/90">
          <span class="font-semibold">{fmtDate(next.startsAt, next.timezone)}</span>
          · {fmtTime(next.startsAt, next.timezone)}
          · {$t('events.page.minutes', { count: next.durationMin })}
          {#if soon}<span class="ms-2 chip">{$t('events.page.soon')}</span>{/if}
        </p>
      {/if}
      <button type="button" onclick={scrollToForm} class="cta mt-6">
        {open.length > 0 ? $t('events.page.cta') : $t('events.page.ctaNotify')}
      </button>
      {#if data.totalRegistered >= SOCIAL_PROOF_MIN}
        <p class="mt-3 text-sm text-white/60">{$t('events.page.registeredCount', { count: data.totalRegistered })}</p>
      {/if}
      {#if event.cover}
        <img src={event.cover} alt="" class="mt-8 w-full max-h-96 object-cover rounded-2xl border border-white/10" />
      {/if}
    </section>

    <div class="max-w-3xl mx-auto px-4 pb-24 space-y-10">
      {#if paras.length}
        <section class="glass rounded-2xl p-6">
          {#each paras as p, i (i)}
            <Translated as="p" class="text-white/85 leading-relaxed mb-3 last:mb-0" text={p} hit={tr.hitFor(p)} showNote={i === paras.length - 1} />
          {/each}
        </section>
      {/if}

      <!-- 2. What you get -->
      {#if event.outcomes.length}
        <section>
          <h2 class="section-title">{$t('events.page.outcomes')}</h2>
          <ul class="grid sm:grid-cols-2 gap-3">
            {#each event.outcomes as o, i (i)}
              <li class="glass rounded-xl p-4 flex gap-3">
                <span class="text-gold font-black">✓</span>
                <Translated class="text-white/85" text={o} hit={tr.hitFor(o)} showNote={false} />
              </li>
            {/each}
          </ul>
          <TranslatedNote hit={tr.firstReal(...event.outcomes)} class="mt-2" />
        </section>
      {/if}

      <!-- 3. Who it is for -->
      {#if event.audience.length}
        <section>
          <h2 class="section-title">{$t('events.page.audience')}</h2>
          <ul class="space-y-2">
            {#each event.audience as a, i (i)}
              <li class="flex gap-3 text-white/85"><span class="text-barbi">●</span><Translated text={a} hit={tr.hitFor(a)} showNote={false} /></li>
            {/each}
          </ul>
          <TranslatedNote hit={tr.firstReal(...event.audience)} class="mt-2" />
        </section>
      {/if}

      <!-- 4. Agenda -->
      {#if event.agenda.length}
        <section>
          <h2 class="section-title">
            {$t('events.page.agenda')}
            {#if totalMinutes}<span class="text-white/50 text-base font-normal">· {$t('events.page.minutes', { count: totalMinutes })}</span>{/if}
          </h2>
          <ol class="space-y-3">
            {#each event.agenda as item, i (i)}
              <li class="glass rounded-xl p-4 flex gap-4">
                <span class="shrink-0 w-16 text-gold font-bold">
                  {item.minutes != null ? $t('events.page.minutesShort', { count: item.minutes }) : ''}
                </span>
                <span>
                  <Translated class="block font-semibold" text={item.title} hit={tr.hitFor(item.title)} showNote={false} />
                  {#if item.desc}<Translated class="block text-sm text-white/70 mt-1" text={item.desc} hit={tr.hitFor(item.desc)} showNote={false} />{/if}
                </span>
              </li>
            {/each}
          </ol>
          <TranslatedNote hit={tr.firstReal(...event.agenda.flatMap((i) => [i.title, i.desc]))} class="mt-2" />
        </section>
      {/if}

      <!-- 5. Hosts -->
      {#if event.hosts.length}
        <section>
          <h2 class="section-title">{$t('events.page.hosts')}</h2>
          <div class="flex flex-wrap gap-4">
            {#each event.hosts as h (h.id)}
              <a href={`/user/${h.id}`} class="flex items-center gap-3 glass rounded-full pe-4">
                {#if h.pic}
                  <img src={h.pic} alt="" class="w-12 h-12 rounded-full object-cover" />
                {:else}
                  <span class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold">{h.name.slice(0, 1)}</span>
                {/if}
                <span class="font-semibold">{h.name}</span>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 6. Pick a date + form -->
      <section id="register" class="glass rounded-2xl p-6 scroll-mt-6">
        <h2 class="section-title">{open.length > 0 ? $t('events.page.pickDate') : $t('events.page.noDateTitle')}</h2>
        {#if open.length === 0}
          <p class="text-white/75 mb-4">{$t('events.page.noDateBody')}</p>
        {/if}

        <form onsubmit={submit} class="space-y-4" novalidate>
          {#if open.length > 0}
            <fieldset class="grid gap-3 sm:grid-cols-2">
              <legend class="sr-only">{$t('events.page.pickDate')}</legend>
              {#each open as s (s.key)}
                <label class="session-card" class:selected={sessionKey === s.key}>
                  <input type="radio" name="session" value={s.key} bind:group={sessionKey} class="sr-only" />
                  <span class="block font-semibold">{fmtDate(s.startsAt, s.timezone)}</span>
                  <span class="block text-lg">{fmtTime(s.startsAt, s.timezone)}</span>
                  {#if localTime(s.startsAt, s.timezone)}
                    <span class="block text-xs text-white/60">{$t('events.page.yourTime', { time: localTime(s.startsAt, s.timezone) })}</span>
                  {/if}
                  {#if s.seatsLeft !== null}
                    <span class="block text-xs mt-1 {s.seatsLeft === 0 ? 'text-barbi' : 'text-gold'}">
                      {s.seatsLeft === 0 ? $t('events.page.fullWaitlist') : $t('events.page.seatsLeft', { count: s.seatsLeft })}
                    </span>
                  {/if}
                </label>
              {/each}
            </fieldset>
          {/if}

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="field">
              <span>{$t('events.form.name')}</span>
              <input bind:value={name} required autocomplete="name" maxlength="120" />
            </label>
            <label class="field">
              <span>{$t('events.form.email')}</span>
              <input bind:value={email} type="email" required autocomplete="email" dir="ltr" maxlength="254" />
            </label>
            <label class="field sm:col-span-2">
              <span>{$t('events.form.phone')}</span>
              <input bind:value={phone} type="tel" autocomplete="tel" dir="ltr" maxlength="40" />
            </label>
            {#each event.form as f (f.key)}
              {#if f.type === 'checkbox'}
                <label class="flex items-center gap-2 sm:col-span-2">
                  <input type="checkbox" checked={answers[f.key] === true} onchange={(e) => (answers[f.key] = e.currentTarget.checked)} />
                  <span>{f.label}{f.required ? ' *' : ''}</span>
                </label>
              {:else if f.type === 'select'}
                <label class="field sm:col-span-2">
                  <span>{f.label}{f.required ? ' *' : ''}</span>
                  <select bind:value={answers[f.key]}>
                    <option value="">—</option>
                    {#each f.options ?? [] as o (o)}<option value={o}>{o}</option>{/each}
                  </select>
                </label>
              {:else}
                <label class="field sm:col-span-2">
                  <span>{f.label}{f.required ? ' *' : ''}</span>
                  <input bind:value={answers[f.key]} maxlength="1000" />
                </label>
              {/if}
            {/each}
          </div>

          <!-- Honeypot: people never see it; a bot fills it. -->
          <div class="hp" aria-hidden="true">
            <label>Website <input bind:value={website} tabindex="-1" autocomplete="off" /></label>
          </div>

          <label class="flex items-start gap-2 text-sm text-white/80">
            <input type="checkbox" bind:checked={consent} class="mt-1" />
            <span>{event.consentText ?? $t('events.form.consentDefault')}</span>
          </label>

          {#if problem}
            <p class="text-barbi text-sm" role="alert">{$t(`events.problem.${problem}`) || $t('events.problem.error')}</p>
          {/if}

          <button type="submit" class="cta w-full" disabled={busy || data.preview}>
            {busy ? $t('events.form.sending') : open.length > 0 ? $t('events.form.submit') : $t('events.form.submitNotify')}
          </button>
          {#if data.preview}
            <p class="text-xs text-white/60 text-center">{$t('events.page.previewNoRegister')}</p>
          {/if}
        </form>
      </section>

      <!-- 7. Questions -->
      {#if event.faq.length}
        <section>
          <h2 class="section-title">{$t('events.page.faq')}</h2>
          <div class="space-y-2">
            {#each event.faq as f, i (i)}
              <details class="glass rounded-xl p-4">
                <summary class="font-semibold cursor-pointer"><Translated text={f.q} hit={tr.hitFor(f.q)} showNote={false} /></summary>
                <Translated as="p" class="mt-2 text-white/80" text={f.a} hit={tr.hitFor(f.a)} />
              </details>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 8. Last call -->
      <section class="text-center">
        <button type="button" onclick={scrollToForm} class="cta">
          {open.length > 0 ? $t('events.page.cta') : $t('events.page.ctaNotify')}
        </button>
      </section>
    </div>
  </div>
</RikmaSkin>

<style>
  .event-page {
    background:
      radial-gradient(1000px 400px at 85% -5%, rgb(var(--pp-barbi) / 0.1), transparent 60%),
      radial-gradient(900px 500px at 5% 15%, rgb(var(--pp-gold) / 0.08), transparent 55%),
      linear-gradient(160deg, var(--pp-bg1) 0%, var(--pp-bg2) 45%, var(--pp-bg3) 100%);
  }
  .glass {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.09);
  }
  .section-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: rgb(var(--pp-gold-soft));
  }
  .cta {
    display: inline-block;
    padding: 0.85rem 2rem;
    border-radius: 9999px;
    font-weight: 800;
    background: linear-gradient(90deg, rgb(var(--pp-gold)), rgb(var(--pp-gold-2)));
    color: rgb(var(--pp-on-gold));
    box-shadow: 0 0 30px rgb(var(--pp-gold) / 0.25);
  }
  .cta:disabled {
    opacity: 0.6;
  }
  .chip {
    display: inline-block;
    padding: 0.1rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    background: rgb(var(--pp-barbi) / 0.25);
    color: rgb(var(--pp-barbi-soft));
  }
  .session-card {
    display: block;
    cursor: pointer;
    padding: 1rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.04);
  }
  .session-card.selected {
    border-color: rgb(var(--pp-gold));
    box-shadow: 0 0 0 1px rgb(var(--pp-gold)) inset;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.9rem;
  }
  .field input,
  .field select {
    padding: 0.65rem 0.8rem;
    border-radius: 0.6rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #fff;
  }
  .field select option {
    color: #000;
  }
  .hp {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
</style>
