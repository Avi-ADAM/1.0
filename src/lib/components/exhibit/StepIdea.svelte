<!--
  Step 2 · Idea (docs/inprogress/PLAN_EXHIBITION_MODE.md §3.2).

  choose    six ready ideas and "I have my own" — click, or press 1–7;
  custom    one big field for the visitor's own words;
  thinking  the assistant's moment: a bulb with threads circling it. A ready
            idea is answered at once (the pause is the story, not a wait); the
            visitor's own idea goes to the live assistant when the kiosk holds
            a pass, and falls back to the nearest ready idea when no draft
            comes in time — the visitor sees the same scene either way;
  sprout    the idea at the centre, its parts growing out of it on threads:
            missions with their hours and share of the work, resources, and
            what the rikma will offer. The shares are boardsToVisionPreview's.
-->
<script>
  import { onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { t, locale } from '$lib/translations';
  import { IDEA_KEYS } from '$lib/exhibit/types';
  import { draftIdea } from '$lib/exhibit/assistant';
  import { formatSharePct } from '$lib/equity/computeMissionEquity';
  import IdeaGlyph from './IdeaGlyph.svelte';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox, aiPass?: boolean }} */
  let { sandbox, aiPass = false } = $props();

  /** @typedef {'choose' | 'custom' | 'thinking' | 'sprout'} Phase */
  // Coming back to this step with an idea already chosen opens on its sprout.
  /** @returns {Phase} */
  const startPhase = () => (sandbox.idea ? 'sprout' : 'choose');
  let phase = $state(startPhase());
  let text = $state('');
  /** The visitor's own words were answered by a ready idea, not a live draft. */
  let nearestOnly = $state(false);

  const THINK_MS = 1700;
  const MIN_TEXT = 3;
  let alive = true;
  onDestroy(() => (alive = false));

  const wait = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

  /** @param {import('$lib/exhibit/types').IdeaKey} key */
  async function chooseReady(key) {
    phase = 'thinking';
    nearestOnly = false;
    await wait(THINK_MS);
    if (!alive) return;
    sandbox.chooseTemplate(key);
    phase = 'sprout';
  }

  async function chooseOwn() {
    const words = text.trim();
    if (words.length < MIN_TEXT) return;
    phase = 'thinking';
    const round = sandbox.round;
    const [draft] = await Promise.all([
      aiPass && words.length >= 8 ? draftIdea(words, $locale) : Promise.resolve(null),
      wait(THINK_MS)
    ]);
    // The visitor may have gone home while the assistant was thinking.
    if (!alive || round !== sandbox.round) return;
    if (draft) sandbox.chooseCustomDraft(words, draft);
    else sandbox.chooseCustomLocal(words);
    nearestOnly = !draft;
    phase = 'sprout';
  }

  function another() {
    phase = 'choose';
    text = '';
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (phase !== 'choose' || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > IDEA_KEYS.length + 1) return;
    e.preventDefault();
    if (n <= IDEA_KEYS.length) chooseReady(IDEA_KEYS[n - 1]);
    else phase = 'custom';
  }

  /** @param {import('$lib/exhibit/types').ExhibitTask} task */
  const label = (task) => (task.i18n ? $t(task.label) : task.label);
  let ideaTitle = $derived(sandbox.idea ? (sandbox.idea.i18n ? $t(sandbox.idea.title) : sandbox.idea.title) : '');

  // ── The sprout scene's geometry ──────────────────────────────────────
  let cw = $state(0);
  let ch = $state(0);
  let parts = $derived(
    sandbox.idea ? [...sandbox.idea.missions, ...sandbox.idea.resources, ...sandbox.idea.products] : []
  );
  let placed = $derived(
    parts.map((task, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / parts.length;
      const x = Math.cos(a) * cw * 0.36;
      const y = Math.sin(a) * ch * 0.37;
      // A thread that bows a little, like a real one.
      const bow = 0.18;
      const cx = cw / 2 + x / 2 - y * bow;
      const cy = ch / 2 + y / 2 + x * bow;
      return { task, x, y, d: `M ${cw / 2} ${ch / 2} Q ${cx} ${cy} ${cw / 2 + x} ${ch / 2 + y}` };
    })
  );

  /** @param {HTMLElement} el */
  const focusOnMount = (el) => {
    el.focus({ preventScroll: true });
  };
</script>

<svelte:window onkeydown={onKey} />

<section class="idea">
  {#if phase === 'choose'}
    <div class="choose" in:fade={{ duration: 400 }}>
      <header>
        <h1 class="ex-display">{$t('exhibit.idea.title')}</h1>
        <p class="sub">{$t('exhibit.idea.sub')}</p>
      </header>
      <ul class="cards">
        {#each IDEA_KEYS as key, i (key)}
          <li in:fly={{ y: 40, duration: 500, delay: 60 * i }}>
            <button type="button" class="card" onclick={() => chooseReady(key)}>
              <span class="num" aria-hidden="true">{i + 1}</span>
              <IdeaGlyph kind={key} size={72} />
              <span class="card-title">{$t(`exhibit.ideas.${key}.title`)}</span>
              <span class="card-line">{$t(`exhibit.ideas.${key}.line`)}</span>
            </button>
          </li>
        {/each}
        <li class="own" in:fly={{ y: 40, duration: 500, delay: 60 * IDEA_KEYS.length }}>
          <button type="button" class="card card-own" onclick={() => (phase = 'custom')}>
            <span class="num" aria-hidden="true">{IDEA_KEYS.length + 1}</span>
            <IdeaGlyph kind="own" size={72} />
            <span class="card-title">{$t('exhibit.idea.custom.title')}</span>
            <span class="card-line">{$t('exhibit.idea.custom.line')}</span>
          </button>
        </li>
      </ul>
    </div>
  {:else if phase === 'custom'}
    <form
      class="custom"
      in:scale={{ start: 0.95, duration: 350 }}
      onsubmit={(e) => {
        e.preventDefault();
        chooseOwn();
      }}
    >
      <IdeaGlyph kind="own" size={110} />
      <label for="ex-own" class="ex-display">{$t('exhibit.idea.custom.label')}</label>
      <input
        id="ex-own"
        bind:value={text}
        use:focusOnMount
        maxlength="200"
        autocomplete="off"
        dir="auto"
        placeholder={$t('exhibit.idea.custom.placeholder')}
        onkeydown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            another();
          }
        }}
      />
      <div class="row">
        <button type="button" class="ex-btn ex-btn-ghost" onclick={another}>{$t('exhibit.idea.custom.cancel')}</button>
        <button type="submit" class="ex-btn ex-btn-primary" disabled={text.trim().length < MIN_TEXT}>
          {$t('exhibit.idea.custom.go')}
        </button>
      </div>
    </form>
  {:else if phase === 'thinking'}
    <div class="thinking" in:fade={{ duration: 300 }} role="status">
      <div class="bulb">
        <span class="orbit o1" aria-hidden="true"></span>
        <span class="orbit o2" aria-hidden="true"></span>
        <span class="orbit o3" aria-hidden="true"></span>
        <IdeaGlyph kind="own" size={130} />
      </div>
      <p class="ex-display">{$t('exhibit.idea.thinking')}</p>
    </div>
  {:else if sandbox.idea}
    <div class="sprout" in:fade={{ duration: 400 }}>
      <header>
        <h1 class="ex-display">{$t('exhibit.idea.sproutTitle')}</h1>
        <p class="sub">{$t('exhibit.idea.sproutSub')}</p>
      </header>

      <div class="scene" bind:clientWidth={cw} bind:clientHeight={ch}>
        {#if cw && ch}
          <svg class="threads" viewBox="0 0 {cw} {ch}" aria-hidden="true">
            {#each placed as p, i (p.task.kind + p.task.id)}
              <path
                d={p.d}
                pathLength="1"
                class="thread {p.task.kind}"
                style="animation-delay:{250 + i * 140}ms"
              />
            {/each}
          </svg>

          <div class="center" in:scale={{ start: 0.6, duration: 600 }}>
            <IdeaGlyph kind={sandbox.idea.key === 'custom' ? 'own' : sandbox.idea.key} size={64} />
            <span class="center-title" dir="auto">{ideaTitle}</span>
            {#if sandbox.idea.source === 'ai'}
              <span class="badge ai">✦ {$t('exhibit.idea.aiBadge')}</span>
            {:else if nearestOnly}
              <span class="badge">{$t('exhibit.idea.templateNote')}</span>
            {/if}
          </div>

          <ul class="parts">
            {#each placed as p, i (p.task.kind + p.task.id)}
              <li
                class="part {p.task.kind}"
                style="transform: translate(calc(-50% + {p.x}px), calc(-50% + {p.y}px))"
              >
                <div class="part-inner" style="animation-delay:{450 + i * 140}ms">
                  <span class="kind">{$t(`exhibit.idea.legend.${p.task.kind}`)}</span>
                  <span class="part-label" dir="auto">{label(p.task)}</span>
                  {#if p.task.kind === 'mission' && p.task.hours}
                    <span class="facts">
                      {$t('exhibit.idea.hours', { count: p.task.hours })}
                      {#if p.task.share}
                        · {$t('exhibit.idea.share', { pct: formatSharePct(p.task.share) })}
                      {/if}
                    </span>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="row actions">
        <button type="button" class="ex-btn ex-btn-ghost" onclick={another}>{$t('exhibit.idea.again')}</button>
        <button type="button" class="ex-btn ex-btn-primary" use:focusOnMount onclick={() => sandbox.next()}>
          {$t('exhibit.idea.next')}
          <span class="ltr:-scale-x-100 inline-block" aria-hidden="true">←</span>
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  .idea {
    display: grid;
    min-height: 0;
    padding: 0 clamp(1.5rem, 4vw, 5rem) clamp(0.5rem, 1.5vh, 1.5rem);
  }
  header {
    text-align: center;
  }
  h1 {
    font-size: clamp(2.6rem, 4.4vw, 5.5rem);
  }
  .sub {
    margin: 0.4em 0 0;
    font-size: clamp(1.25rem, 1.7vw, 2rem);
    color: var(--ex-ink-soft);
  }
  .row {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
  }

  /* ── choose ─────────────────────────────────────────────────────── */
  .choose {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: clamp(1rem, 3vh, 3rem);
    min-height: 0;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 1fr;
    gap: clamp(1rem, 1.6vw, 2rem);
    list-style: none;
    margin: 0;
    padding: 0;
    min-height: 0;
    max-height: 62vh;
  }
  .own {
    grid-column: span 2;
  }
  .card {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1.25rem;
    border-radius: 2rem;
    border: 3px solid var(--ex-gold-soft);
    background: rgba(255, 250, 242, 0.82);
    backdrop-filter: blur(6px);
    font: inherit;
    color: var(--ex-ink);
    cursor: pointer;
    text-align: center;
    transition:
      transform 250ms ease,
      border-color 250ms ease,
      box-shadow 250ms ease;
  }
  .card:hover {
    transform: translateY(-6px);
    border-color: var(--ex-pink);
    box-shadow: 0 22px 50px rgba(184, 0, 105, 0.16);
  }
  .card-own {
    border-style: dashed;
    border-color: var(--ex-pink);
    background: linear-gradient(135deg, rgba(253, 232, 239, 0.9), rgba(255, 250, 242, 0.9));
  }
  .num {
    position: absolute;
    top: 1rem;
    inset-inline-start: 1.1rem;
    width: 2.2rem;
    height: 2.2rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--ex-gold-soft);
    font-weight: 800;
    font-size: 1.1rem;
  }
  .card-title {
    font-size: clamp(1.35rem, 1.65vw, 2.1rem);
    font-weight: 800;
    line-height: 1.15;
  }
  .card-line {
    font-size: clamp(1rem, 1.15vw, 1.4rem);
    color: var(--ex-ink-soft);
  }

  /* ── custom ─────────────────────────────────────────────────────── */
  .custom {
    place-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    width: min(1100px, 90vw);
  }
  .custom label {
    font-size: clamp(2.4rem, 3.6vw, 4.4rem);
  }
  .custom input {
    width: 100%;
    font: inherit;
    font-size: clamp(1.8rem, 2.6vw, 3.2rem);
    padding: 0.6em 0.9em;
    border-radius: 1.5rem;
    border: 3px solid var(--ex-gold);
    background: #fff;
    color: var(--ex-ink);
    text-align: center;
    user-select: text;
  }
  .custom input:focus {
    outline: none;
    border-color: var(--ex-pink);
    box-shadow: 0 0 0 8px rgba(226, 18, 122, 0.14);
  }
  .custom button[type='submit']:disabled {
    opacity: 0.45;
    transform: none;
  }

  /* ── thinking ───────────────────────────────────────────────────── */
  .thinking {
    place-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
  }
  .thinking p {
    font-size: clamp(1.8rem, 2.6vw, 3.2rem);
    color: var(--ex-ink);
  }
  .bulb {
    position: relative;
    display: grid;
    place-items: center;
    width: 300px;
    height: 300px;
  }
  .orbit {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px dashed var(--ex-pink);
    opacity: 0.55;
    animation: spin 6s linear infinite;
  }
  .o2 {
    inset: 30px;
    border-color: var(--ex-gold);
    border-style: dotted;
    animation-duration: 4s;
    animation-direction: reverse;
  }
  .o3 {
    inset: -30px;
    border-color: var(--ex-gold-soft);
    animation-duration: 9s;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ── sprout ─────────────────────────────────────────────────────── */
  .sprout {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: clamp(0.5rem, 1.5vh, 1.5rem);
    min-height: 0;
  }
  .scene {
    position: relative;
    min-height: 0;
  }
  .threads {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .thread {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 900ms ease-out forwards;
  }
  .thread.mission {
    stroke: var(--ex-pink);
  }
  .thread.resource {
    stroke: var(--ex-gold);
  }
  .thread.product {
    stroke: var(--ex-sage);
    stroke-dasharray: 0.02 0.015;
    stroke-dashoffset: 0;
    animation: none;
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  .center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    width: clamp(220px, 18vw, 340px);
    padding: 1.4rem 1.2rem;
    border-radius: 50%;
    aspect-ratio: 1;
    justify-content: center;
    text-align: center;
    background: radial-gradient(circle, #fff 55%, var(--ex-blush));
    border: 4px solid var(--ex-gold);
    box-shadow:
      0 0 0 14px rgba(212, 161, 42, 0.14),
      0 24px 60px rgba(58, 36, 24, 0.14);
  }
  .center-title {
    font-size: clamp(1.3rem, 1.6vw, 2rem);
    font-weight: 800;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .badge {
    font-size: clamp(0.85rem, 0.95vw, 1.1rem);
    font-weight: 700;
    color: var(--ex-ink-soft);
    background: var(--ex-gold-soft);
    border-radius: 999px;
    padding: 0.2em 0.8em;
  }
  .badge.ai {
    color: #fff;
    background: var(--ex-pink-deep);
  }
  .parts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .part {
    position: absolute;
    left: 50%;
    top: 50%;
    width: clamp(220px, 15vw, 300px);
  }
  .part-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.85rem 1rem;
    border-radius: 1.4rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.92);
    border: 3px solid var(--ex-pink);
    box-shadow: 0 14px 34px rgba(58, 36, 24, 0.1);
    opacity: 0;
    transform: scale(0.6);
    animation: pop 500ms cubic-bezier(0.2, 1.4, 0.4, 1) forwards;
  }
  .resource .part-inner {
    border-color: var(--ex-gold);
    border-radius: 0.6rem;
  }
  .product .part-inner {
    border-color: var(--ex-sage);
    background: linear-gradient(135deg, #fff, #f1f5ef);
  }
  @keyframes pop {
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .kind {
    font-size: clamp(0.8rem, 0.85vw, 1rem);
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ex-pink-deep);
  }
  .resource .kind {
    color: #9a6f0c;
  }
  .product .kind {
    color: #4e6b4b;
  }
  .part-label {
    font-size: clamp(1.1rem, 1.3vw, 1.6rem);
    font-weight: 700;
    line-height: 1.2;
  }
  .facts {
    font-size: clamp(0.9rem, 1vw, 1.2rem);
    color: var(--ex-ink-soft);
  }
</style>
