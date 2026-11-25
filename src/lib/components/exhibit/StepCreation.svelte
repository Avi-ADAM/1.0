<!--
  Step 5 · Creation (docs/inprogress/PLAN_EXHIBITION_MODE.md §3.5, §7).

  story   half a year in a few seconds: every part taken is done and approved,
          the hours add up, the idea fills with colour, and the first sale
          comes in.
  split   the money is with the visitor ("it is with me" — a sovereign
          self-report on the platform), and coins run from them to every
          partner: `splitPreview`, the sales page's own "who hands what to
          whom", over the shares everyone signed.
  finale  "Your next idea can become real." — and a QR for this one. Behind
          it is the signed rikma, kept on 1lev1 as a draft for 30 days
          (/api/exhibit/draft); scanning opens it on the visitor's phone,
          where they can sign up into it or ask to be called back. No phone:
          an email here does the same. Without the kiosk pass (or if keeping
          the draft fails) the QR points at /vision and the form is hidden.
          The finale goes back to the welcome screen by itself after 45
          seconds untouched.
-->
<script>
  import { onDestroy, onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { page } from '$app/state';
  import { t, locale, isRtl } from '$lib/translations';
  import { ME } from '$lib/exhibit/sandbox.svelte';
  import { PEOPLE, colorOf, variantOf } from '$lib/exhibit/fixtures/people';
  import { sandboxToBlueprint } from '$lib/exhibit/blueprint';
  import { handoffUrl, requestDraft, sendLead } from '$lib/exhibit/handoff';
  import Face from './Face.svelte';
  import IdeaGlyph from './IdeaGlyph.svelte';
  import QrCode from './QrCode.svelte';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox, pass?: boolean }} */
  let { sandbox, pass = false } = $props();

  /** @typedef {'story' | 'split' | 'finale'} Phase */
  let phase = $state(/** @type {Phase} */ ('story'));
  let doneCount = $state(0);
  let saleShown = $state(false);

  const FINALE_IDLE_MS = 45_000;

  // ── Labels and numbers ────────────────────────────────────────────────
  /** @param {import('$lib/exhibit/types').ExhibitTask} task */
  const label = (task) => (task.i18n ? $t(task.label) : task.label);
  const nameOf = (/** @type {string} */ id) =>
    id === ME ? $t('exhibit.connection.me.name') : $t(`exhibit.people.${id}.name`);
  const money = (/** @type {number} */ n) => `₪${Math.round(n).toLocaleString($locale)}`;
  const hueOf = (/** @type {string} */ id) => PEOPLE.find((p) => p.id === id)?.hue ?? 45;

  let ideaTitle = $derived(sandbox.idea ? (sandbox.idea.i18n ? $t(sandbox.idea.title) : sandbox.idea.title) : '');
  let taken = $derived(sandbox.tasks.filter((task) => sandbox.ownerOf(task)));
  let approvedHours = $derived(
    taken.filter((task) => task.kind === 'mission').reduce((s, task) => s + (sandbox.hoursOf(task) ?? 0), 0)
  );
  let product = $derived(sandbox.idea?.products[0] ? label(sandbox.idea.products[0]) : ideaTitle);
  let rows = $derived(sandbox.split.rows);
  let mine = $derived(rows.find((r) => r.uid === ME));
  let others = $derived(rows.filter((r) => r.uid !== ME && r.x > 0.5));

  const hours = new Tween(0, { duration: 2600, easing: cubicOut });
  const sale = new Tween(0, { duration: 1400, easing: cubicOut });

  // ── Timers that die with the step (or with a reset) ───────────────────
  /** @type {ReturnType<typeof setTimeout>[]} */
  let timers = [];
  let alive = true;
  const later = (/** @type {() => void} */ fn, /** @type {number} */ ms) => {
    const round = sandbox.round;
    timers.push(setTimeout(() => alive && round === sandbox.round && fn(), ms));
  };
  onDestroy(() => {
    alive = false;
    timers.forEach(clearTimeout);
  });

  // ── The draft behind the QR ───────────────────────────────────────────
  /** @returns {'pending' | 'ready' | 'none'} */
  const startDraftState = () => (sandbox.draft ? 'ready' : pass ? 'pending' : 'none');
  let draftState = $state(startDraftState());

  async function keepDraft() {
    if (sandbox.draft || !pass || !sandbox.idea) return;
    const blueprint = sandboxToBlueprint(sandbox, {
      me: ME,
      title: ideaTitle,
      description: sandbox.idea.key !== 'custom' ? $t(`exhibit.ideas.${sandbox.idea.key}.line`) : undefined,
      label
    });
    const round = sandbox.round;
    const draft = await requestDraft(blueprint, $locale);
    if (!alive || round !== sandbox.round) return;
    sandbox.draft = draft;
    draftState = draft ? 'ready' : 'none';
  }

  let qrValue = $derived(handoffUrl(page.url.origin, sandbox.draft, $locale));

  // ── The story ─────────────────────────────────────────────────────────
  onMount(() => {
    keepDraft();
    taken.forEach((_, i) => later(() => (doneCount = i + 1), 500 + i * 380));
    hours.set(approvedHours);
    later(() => {
      saleShown = true;
      sale.set(sandbox.firstSale);
    }, 600 + taken.length * 380 + 500);
    later(() => phase === 'story' && (phase = 'split'), 600 + taken.length * 380 + 3600);
  });

  // ── Split geometry: the holder above, the partners in a row below ─────
  let sw = $state(0);
  let sh = $state(0);
  // The visitor first, from where reading starts.
  let row = $derived(
    rows.map((r, i) => {
      const x = ((i + 0.5) / rows.length) * sw;
      return { id: String(r.uid), x: $isRtl ? sw - x : x };
    })
  );
  const holderAt = () => ({ x: sw / 2, y: sh * 0.2 });
  const pathTo = (/** @type {number} */ x) => {
    const h = holderAt();
    const y = sh * 0.66;
    return `M ${h.x} ${h.y} C ${h.x} ${(h.y + y) / 2}, ${x} ${(h.y + y) / 2}, ${x} ${y}`;
  };

  // ── Finale ────────────────────────────────────────────────────────────
  let email = $state('');
  let name = $state('');
  let agreed = $state(false);
  let sendState = $state(/** @type {'idle' | 'sending' | 'sent' | 'error'} */ ('idle'));

  async function send(/** @type {SubmitEvent} */ e) {
    e.preventDefault();
    if (!sandbox.draft || !agreed || !email.trim() || sendState === 'sending') return;
    sendState = 'sending';
    const ok = await sendLead(sandbox.draft, { name: name.trim(), email: email.trim() }, 'kiosk');
    if (!alive) return;
    sendState = ok ? 'sent' : 'error';
    if (ok) {
      // A public screen: the next visitor must not see this one's address.
      email = '';
      name = '';
      agreed = false;
    }
  }

  $effect(() => {
    if (phase !== 'finale') return;
    /** @type {ReturnType<typeof setTimeout>} */
    let timer;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => sandbox.reset(), FINALE_IDLE_MS);
    };
    const events = /** @type {const} */ (['pointermove', 'pointerdown', 'keydown', 'wheel']);
    for (const ev of events) window.addEventListener(ev, arm, { passive: true });
    arm();
    return () => {
      clearTimeout(timer);
      for (const ev of events) window.removeEventListener(ev, arm);
    };
  });

  /** @param {HTMLElement} el */
  const focusOnMount = (el) => {
    el.focus({ preventScroll: true });
  };
</script>

<section class="create">
  {#if phase === 'story'}
    <div class="story" in:fade={{ duration: 400 }}>
      <p class="later ex-display">{$t('exhibit.creation.later')}</p>
      <div class="timeline" aria-hidden="true"><span></span></div>

      <div class="story-body">
        <div class="bloom" style="--fill:{taken.length ? doneCount / taken.length : 1}">
          <IdeaGlyph kind={sandbox.idea?.key === 'custom' ? 'own' : (sandbox.idea?.key ?? 'own')} size={110} />
          <span class="bloom-title" dir="auto">{ideaTitle}</span>
        </div>

        <ul class="done-list">
          {#each taken as task, i (task.kind + task.id)}
            {@const owner = sandbox.ownerOf(task) ?? ME}
            <li class:done={i < doneCount}>
              <span class="mini"><Face hue={hueOf(owner)} variant={variantOf(owner)} me={owner === ME} /></span>
              <span class="done-label" dir="auto">{label(task)}</span>
              <span class="tick" aria-hidden="true">✓</span>
            </li>
          {/each}
        </ul>
      </div>

      <div class="story-foot">
        <p class="hours">
          {doneCount >= taken.length ? $t('exhibit.creation.allDone') + ' · ' : ''}{$t('exhibit.creation.hours', {
            count: Math.round(hours.current)
          })}
        </p>
        {#if saleShown}
          <div class="sale-card" in:scale={{ start: 0.7, duration: 500 }}>
            <span class="sale-title" dir="auto">{$t('exhibit.creation.sale', { product })}</span>
            <span class="sale-amount">{$t('exhibit.creation.saleIn', { amount: money(sale.current) })}</span>
          </div>
        {/if}
        <button type="button" class="ex-btn ex-btn-ghost" onclick={() => (phase = 'split')}>{$t('exhibit.creation.skip')}</button>
      </div>
    </div>
  {:else if phase === 'split'}
    <div class="split" in:fade={{ duration: 400 }}>
      <header>
        <h1 class="ex-display">{$t('exhibit.creation.splitTitle')}</h1>
        <p class="sub">{$t('exhibit.creation.splitSub')}</p>
      </header>

      <div class="scene" bind:clientWidth={sw} bind:clientHeight={sh}>
        {#if sw && sh}
          <svg class="flow" viewBox="0 0 {sw} {sh}" aria-hidden="true">
            {#each row as r, i (r.id)}
              {#if r.id !== ME && others.some((o) => String(o.uid) === r.id)}
                <path d={pathTo(r.x)} class="rail" />
                {#each [0, 1, 2] as k (k)}
                  <!-- Hidden until it starts moving: before its turn a coin sits at 0,0. -->
                  <circle r="11" class="coin" visibility="hidden">
                    <set attributeName="visibility" to="visible" begin="{0.4 + i * 0.25 + k * 0.45}s" fill="freeze" />
                    <animateMotion
                      dur="1.6s"
                      begin="{0.4 + i * 0.25 + k * 0.45}s"
                      repeatCount="2"
                      fill="freeze"
                      path={pathTo(r.x)}
                    />
                  </circle>
                {/each}
              {/if}
            {/each}
          </svg>

          <div class="holder" style="transform: translate(-50%, -50%) translateY({sh * 0.2}px)">
            <span class="holder-sum">{money(sandbox.firstSale)}</span>
            <span class="holder-what" dir="auto">{product}</span>
          </div>

          {#each rows as r, i (r.uid)}
            {@const id = String(r.uid)}
            <div
              class="payee"
              class:me={id === ME}
              style="transform: translate(-50%, 0) translate({(row[i]?.x ?? sw / 2) - sw / 2}px, {sh * 0.62}px); --c:{colorOf(id)}"
              in:fly={{ y: 20, duration: 400, delay: 200 + i * 120 }}
            >
              <span class="payee-face"><Face hue={hueOf(id)} variant={variantOf(id)} me={id === ME} /></span>
              <span class="payee-name" dir="auto">{nameOf(id)}</span>
              <span class="payee-amount">
                {id === ME ? $t('exhibit.creation.kept', { amount: money(r.x) }) : money(r.x)}
              </span>
              <span class="payee-pct">{r.p.toFixed(1)}%</span>
            </div>
          {/each}
        {/if}
      </div>

      <footer class="bar">
        <span></span>
        <button type="button" class="ex-btn ex-btn-primary" use:focusOnMount onclick={() => (phase = 'finale')}>
          {$t('exhibit.creation.next')}
          <span class="ltr:-scale-x-100 inline-block" aria-hidden="true">←</span>
        </button>
      </footer>
    </div>
  {:else}
    <div class="finale" in:fade={{ duration: 500 }}>
      <div class="words">
        <h1 class="ex-display">{$t('exhibit.creation.finale')}</h1>
        <p class="scan">{draftState === 'ready' ? $t('exhibit.creation.scan') : $t('exhibit.creation.scanGeneric')}</p>
        {#if draftState === 'ready'}
          <p class="keeps">{$t('exhibit.creation.keeps')}</p>

          <form class="keep-form" onsubmit={send}>
            <p class="no-phone">{$t('exhibit.creation.noPhone')}</p>
            {#if sendState === 'sent'}
              <p class="sent" in:fade>{$t('exhibit.creation.sent')}</p>
            {:else}
              <div class="fields">
                <input
                  type="email"
                  bind:value={email}
                  placeholder={$t('exhibit.creation.email')}
                  aria-label={$t('exhibit.creation.email')}
                  autocomplete="off"
                  dir="ltr"
                  required
                />
                <input
                  bind:value={name}
                  placeholder={$t('exhibit.creation.name')}
                  aria-label={$t('exhibit.creation.name')}
                  autocomplete="off"
                  dir="auto"
                />
              </div>
              <label class="agree">
                <input type="checkbox" bind:checked={agreed} />
                {$t('exhibit.creation.consent')}
              </label>
              <button type="submit" class="ex-btn ex-btn-ghost" disabled={!agreed || !email.trim() || sendState === 'sending'}>
                {$t('exhibit.creation.send')}
              </button>
              {#if sendState === 'error'}<p class="error">{$t('exhibit.creation.error')}</p>{/if}
            {/if}
          </form>
        {/if}
        <button type="button" class="ex-btn ex-btn-ghost restart" onclick={() => sandbox.reset()}>
          {$t('exhibit.creation.restart')}
        </button>
      </div>

      <div class="code">
        {#if draftState === 'pending'}
          <div class="preparing" role="status">
            <span class="spinner" aria-hidden="true"></span>
            {$t('exhibit.creation.preparing')}
          </div>
        {:else}
          <div in:scale={{ start: 0.85, duration: 500 }}>
            <QrCode value={qrValue} label={$t('exhibit.creation.qrLabel')} size={440} />
          </div>
          <span class="code-title" dir="auto">{ideaTitle}</span>
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .create {
    display: grid;
    min-height: 0;
    padding: 0 clamp(1.5rem, 3vw, 4rem) clamp(0.5rem, 1.2vh, 1.25rem);
  }
  header {
    text-align: center;
  }
  h1 {
    font-size: clamp(2.2rem, 3.2vw, 4.2rem);
  }
  .sub {
    margin: 0.3em 0 0;
    font-size: clamp(1.15rem, 1.5vw, 1.8rem);
    color: var(--ex-ink-soft);
  }

  /* ── story ──────────────────────────────────────────────────────── */
  .story {
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    gap: 1rem;
    min-height: 0;
  }
  .later {
    text-align: center;
    font-size: clamp(2.6rem, 4vw, 5rem);
  }
  .timeline {
    height: 10px;
    border-radius: 10px;
    background: var(--ex-gold-soft);
    overflow: hidden;
    width: min(900px, 70vw);
    justify-self: center;
  }
  /* Grows by width, so it starts wherever reading starts, in either direction. */
  .timeline span {
    display: block;
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, var(--ex-gold), var(--ex-pink));
    animation: grow 3.6s ease-out forwards;
  }
  @keyframes grow {
    to {
      width: 100%;
    }
  }
  .story-body {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: clamp(2rem, 4vw, 5rem);
    align-items: center;
    min-height: 0;
    padding-inline: 4vw;
  }
  .bloom {
    width: clamp(260px, 19vw, 360px);
    aspect-ratio: 1;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 2rem;
    text-align: center;
    border: 5px solid var(--ex-gold);
    background: radial-gradient(
      circle,
      #fff calc(55% - var(--fill) * 25%),
      color-mix(in srgb, var(--ex-pink) calc(var(--fill) * 30%), var(--ex-blush))
    );
    box-shadow: 0 0 calc(var(--fill) * 80px) rgba(226, 18, 122, 0.25);
    transition:
      box-shadow 400ms ease,
      background 400ms ease;
  }
  .bloom-title {
    font-size: clamp(1.3rem, 1.6vw, 2rem);
    font-weight: 800;
    line-height: 1.15;
  }
  .done-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem 1.5rem;
  }
  .done-list li {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.7rem 1rem;
    border-radius: 1.2rem;
    background: rgba(255, 255, 255, 0.8);
    border: 3px solid var(--ex-gold-soft);
    transition:
      border-color 300ms ease,
      background 300ms ease;
  }
  .done-list li.done {
    border-color: var(--ex-sage);
    background: #f2f6f1;
  }
  .mini {
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
  }
  .done-label {
    flex: 1;
    font-size: clamp(1.05rem, 1.25vw, 1.5rem);
    font-weight: 700;
  }
  .tick {
    font-size: 1.6rem;
    font-weight: 800;
    color: #3f6b3c;
    opacity: 0;
    transform: scale(0.4);
    transition:
      opacity 300ms ease,
      transform 300ms cubic-bezier(0.2, 1.6, 0.4, 1);
  }
  .done .tick {
    opacity: 1;
    transform: scale(1);
  }
  .story-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    min-height: 96px;
  }
  .hours {
    margin: 0;
    font-size: clamp(1.2rem, 1.5vw, 1.8rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .sale-card {
    display: flex;
    flex-direction: column;
    padding: 0.8rem 1.6rem;
    border-radius: 1.4rem;
    background: linear-gradient(135deg, #fff7df, #fff);
    border: 3px solid var(--ex-gold);
    box-shadow: 0 16px 40px rgba(212, 161, 42, 0.25);
  }
  .sale-title {
    font-size: clamp(1rem, 1.15vw, 1.4rem);
    font-weight: 700;
    color: var(--ex-ink-soft);
  }
  .sale-amount {
    font-size: clamp(1.6rem, 2.2vw, 2.7rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  /* ── split ──────────────────────────────────────────────────────── */
  .split {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 0.5rem;
    min-height: 0;
  }
  .scene {
    position: relative;
    min-height: 0;
  }
  .flow {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .rail {
    fill: none;
    stroke: var(--ex-gold-soft);
    stroke-width: 3;
    stroke-dasharray: 6 8;
  }
  .coin {
    fill: var(--ex-gold);
    stroke: #fff3c4;
    stroke-width: 3;
  }
  /* Centred, then moved by transform in screen coordinates (the SVG's). */
  .holder,
  .payee {
    position: absolute;
    top: 0;
    left: 50%;
  }
  .holder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: clamp(200px, 14vw, 260px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, #fffaf0 55%, #f6e3a6);
    border: 5px solid var(--ex-gold);
    box-shadow: 0 0 0 14px rgba(212, 161, 42, 0.14);
  }
  .holder-sum {
    font-size: clamp(2rem, 2.6vw, 3.2rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .holder-what {
    font-size: clamp(0.95rem, 1.05vw, 1.25rem);
    color: var(--ex-ink-soft);
    text-align: center;
    padding-inline: 1rem;
  }
  .payee {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    width: clamp(170px, 12vw, 230px);
    padding: 0.9rem 0.8rem;
    border-radius: 1.4rem;
    background: rgba(255, 255, 255, 0.92);
    border: 3px solid var(--c);
    text-align: center;
  }
  .payee.me {
    background: linear-gradient(180deg, #fff7df, #fff);
  }
  .payee-face {
    width: 70px;
    height: 70px;
  }
  .payee-name {
    font-size: clamp(1.1rem, 1.25vw, 1.5rem);
    font-weight: 800;
  }
  .payee-amount {
    font-size: clamp(1.25rem, 1.5vw, 1.8rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--ex-pink-deep);
  }
  .payee-pct {
    font-size: clamp(0.9rem, 1vw, 1.15rem);
    color: var(--ex-ink-soft);
  }
  .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* ── finale ─────────────────────────────────────────────────────── */
  .finale {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: clamp(2rem, 4vw, 6rem);
    align-items: center;
    min-height: 0;
    padding-inline: 3vw;
  }
  .words {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .finale h1 {
    font-size: clamp(3rem, 5vw, 6.5rem);
    color: var(--ex-ink);
    text-wrap: balance;
  }
  .scan {
    margin: 0;
    font-size: clamp(1.4rem, 1.9vw, 2.3rem);
    font-weight: 700;
    color: var(--ex-pink-deep);
  }
  .keeps {
    margin: 0;
    font-size: clamp(1.05rem, 1.25vw, 1.5rem);
    color: var(--ex-ink-soft);
  }
  .keep-form {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-top: 0.75rem;
    padding: 1.1rem 1.3rem;
    border-radius: 1.5rem;
    background: rgba(255, 255, 255, 0.75);
    border: 3px dashed var(--ex-gold-soft);
    width: min(760px, 100%);
  }
  .no-phone {
    margin: 0;
    font-size: clamp(1rem, 1.15vw, 1.35rem);
    font-weight: 700;
  }
  .fields {
    display: flex;
    gap: 0.7rem;
  }
  .fields input {
    flex: 1;
    min-width: 0;
    font: inherit;
    font-size: clamp(1.1rem, 1.3vw, 1.6rem);
    padding: 0.55em 0.8em;
    border-radius: 1rem;
    border: 3px solid var(--ex-gold-soft);
    background: #fff;
    color: var(--ex-ink);
    user-select: text;
  }
  .fields input:focus {
    outline: none;
    border-color: var(--ex-pink);
  }
  .agree {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: clamp(1rem, 1.1vw, 1.3rem);
    cursor: pointer;
  }
  .agree input {
    width: 26px;
    height: 26px;
    accent-color: var(--ex-pink);
  }
  .keep-form :global(.ex-btn) {
    align-self: flex-start;
    min-height: 60px;
    font-size: clamp(1.1rem, 1.3vw, 1.5rem);
  }
  .keep-form :global(.ex-btn:disabled) {
    opacity: 0.45;
    transform: none;
  }
  .sent {
    margin: 0;
    font-size: clamp(1.2rem, 1.4vw, 1.7rem);
    font-weight: 700;
    color: #3f6b3c;
  }
  .error {
    margin: 0;
    color: var(--ex-pink-deep);
    font-weight: 600;
  }
  .restart {
    margin-top: 0.5rem;
  }
  .code {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }
  .code-title {
    font-size: clamp(1.3rem, 1.6vw, 2rem);
    font-weight: 800;
    text-align: center;
  }
  .preparing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    font-size: clamp(1.2rem, 1.4vw, 1.7rem);
    color: var(--ex-ink-soft);
  }
  .spinner {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 6px dashed var(--ex-pink);
    animation: spin 2.4s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
