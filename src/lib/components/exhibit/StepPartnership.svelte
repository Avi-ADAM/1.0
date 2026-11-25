<!--
  Step 4 · Partnership (docs/inprogress/PLAN_EXHIBITION_MODE.md §3.4).

  plan     every part of the idea is a card; under it, the circle's faces —
           a click gives the part to that partner (again: leaves it open).
           Faces whose skills fit carry a gold star. "Let the assistant
           suggest" fills the plan by skill (`suggestAssignment`), and the
           ownership ring beside it is `memberShares` — the split page's own
           arithmetic — moving with every click.
  consent  the plan goes to the partners. Each answers in their own way, the
           way the platform lets them: one signs, one talks first, one counters
           with other hours, and the visitor accepts or meets halfway. Whether
           a partner and the rikma signed the same version is `computeNegoGate`
           — the gate the real finalizers use. There is no "no" anywhere.
  silence  a counter changed everyone's shares, so the new version goes to
           every partner, and the rikma's clock runs: silence is consent.
  signed   the partnership stands; on to what it creates.

  The partners' answers are scripted — they are invented people — but every
  state they move through is the platform's own.
-->
<script>
  import { onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { t, locale } from '$lib/translations';
  import { ME, taskKey } from '$lib/exhibit/sandbox.svelte';
  import { PEOPLE, colorOf, variantOf } from '$lib/exhibit/fixtures/people';
  import { formatSharePct } from '$lib/equity/computeMissionEquity';
  import EquityPie from '$lib/components/equity/EquityPie.svelte';
  import Face from './Face.svelte';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox }} */
  let { sandbox } = $props();

  /** @typedef {'plan' | 'consent' | 'silence' | 'signed'} Phase */
  /** @typedef {'waiting' | 'signed' | 'chat' | 'counter' | 'resent' | 'silent'} Status */

  // Coming back after signing shows the signed partnership, not a blank plan.
  /** @returns {Phase} */
  const startPhase = () => (sandbox.allSigned ? 'signed' : 'plan');
  let phase = $state(startPhase());
  let suggested = $state(false);
  /** @type {Record<string, Status>} */
  let status = $state({});
  /** @type {{ who: string, task: import('$lib/exhibit/types').ExhibitTask, was: number, asked: number, mid: number, from: number, to: number } | null} */
  let counter = $state(null);
  let counterOpen = $state(false);
  /** Partners who talked before signing — their line stays on their card. */
  let talked = $state(/** @type {string[]} */ ([]));

  const SILENCE_MS = 8000;
  const STEP_MS = 1100;

  // ── Timers that die with the step (or with a reset) ───────────────────
  /** @type {ReturnType<typeof setTimeout>[]} */
  let timers = [];
  const later = (/** @type {() => void} */ fn, /** @type {number} */ ms) => {
    const round = sandbox.round;
    timers.push(
      setTimeout(() => {
        if (round === sandbox.round) fn();
      }, ms)
    );
  };
  onDestroy(() => timers.forEach(clearTimeout));

  // ── Labels ────────────────────────────────────────────────────────────
  /** @param {import('$lib/exhibit/types').ExhibitTask} task */
  const label = (task) => (task.i18n ? $t(task.label) : task.label);
  const nameOf = (/** @type {string} */ id) =>
    id === ME ? $t('exhibit.connection.me.name') : $t(`exhibit.people.${id}.name`);
  const money = (/** @type {number} */ n) => `₪${Math.round(n).toLocaleString($locale)}`;
  const hueOf = (/** @type {string} */ id) => PEOPLE.find((p) => p.id === id)?.hue ?? 45;
  const shareOf = (/** @type {string} */ id) => sandbox.shares.rows.find((r) => r.uid === id)?.p ?? 0;

  /** Who in the circle fits each part — the stars on the faces. */
  let fitting = $derived.by(() => {
    /** @type {Record<string, Set<string>>} */
    const out = {};
    for (const id of sandbox.circle) {
      for (const m of sandbox.matchesForPerson(id)) (out[taskKey(m.task)] ??= new Set()).add(id);
    }
    return out;
  });

  let slices = $derived(
    sandbox.shares.rows
      .filter((r) => r.p > 0)
      .map((r) => ({
        key: String(r.uid),
        label: nameOf(String(r.uid)),
        value: r.total,
        pct: r.p,
        color: colorOf(String(r.uid))
      }))
  );
  let anyAssigned = $derived(Object.keys(sandbox.assignments).length > 0);

  // ── Plan ──────────────────────────────────────────────────────────────
  function suggest() {
    sandbox.suggestAssignment();
    suggested = true;
  }

  // ── Consent ───────────────────────────────────────────────────────────
  function send() {
    if (!anyAssigned) return;
    sandbox.proposePlan();
    const partners = [...sandbox.invited];
    status = Object.fromEntries(partners.map((id) => [id, /** @type {Status} */ ('waiting')]));
    talked = [];
    counter = null;
    counterOpen = false;
    phase = 'consent';

    // Who answers how: the last partner holding a mission counters, a middle
    // one talks first when there are three or more, everyone else signs.
    const counterer = [...partners].reverse().find((id) => sandbox.partsOf(id).some((p) => p.kind === 'mission'));
    const talker = partners.length >= 3 ? partners.find((id) => id !== counterer && id !== partners[0]) : undefined;

    partners.forEach((id, i) => {
      later(() => {
        if (id === counterer) openCounter(id);
        else if (id === talker) {
          status = { ...status, [id]: 'chat' };
          talked = [...talked, id];
          later(() => sign(id), 2600);
        } else sign(id);
      }, STEP_MS * (i + 1));
    });
    if (!counterer) later(finish, STEP_MS * (partners.length + 1));
  }

  function sign(/** @type {string} */ id) {
    sandbox.partnerSigns(id);
    status = { ...status, [id]: 'signed' };
  }

  function openCounter(/** @type {string} */ id) {
    const mission = sandbox
      .partsOf(id)
      .filter((p) => p.kind === 'mission')
      .sort((a, b) => (sandbox.hoursOf(b) ?? 0) - (sandbox.hoursOf(a) ?? 0))[0];
    const was = sandbox.hoursOf(mission) ?? 10;
    const asked = Math.max(was + 5, Math.round((was * 1.5) / 5) * 5);
    const from = shareOf(id);
    sandbox.partnerCounters(id, mission, asked);
    const to = shareOf(id);
    counter = { who: id, task: mission, was, asked, mid: Math.round((was + asked) / 2), from, to };
    status = { ...status, [id]: 'counter' };
    counterOpen = true;
  }

  function acceptCounter() {
    if (!counter) return;
    sandbox.iAccept(counter.who);
    status = { ...status, [counter.who]: 'signed' };
    counterOpen = false;
    startSilence();
  }

  function meetHalfway() {
    if (!counter) return;
    const who = counter.who;
    sandbox.iCounter(who, counter.task, counter.mid);
    status = { ...status, [who]: 'waiting' };
    counterOpen = false;
    later(() => {
      sign(who);
      startSilence();
    }, STEP_MS + 300);
  }

  /** The counter moved everyone's shares: the others have the rikma's clock to answer. */
  function startSilence() {
    // The talker may still be talking — the clock waits for every own-part yes first.
    const pending = sandbox.invited.filter((id) => !sandbox.gateFor(id)?.approvable);
    if (pending.length) {
      later(startSilence, 600);
      return;
    }
    phase = 'silence';
    const others = sandbox.invited.filter((id) => id !== counter?.who);
    status = { ...status, ...Object.fromEntries(others.map((id) => [id, /** @type {Status} */ ('resent')])) };
    later(() => {
      status = { ...status, ...Object.fromEntries(others.map((id) => [id, /** @type {Status} */ ('silent')])) };
      finish();
    }, SILENCE_MS);
  }

  function finish() {
    if (sandbox.allSigned) phase = 'signed';
  }

  /** @param {HTMLElement} el */
  const focusOnMount = (el) => {
    el.focus({ preventScroll: true });
  };
</script>

<section class="part">
  <header>
    {#if phase === 'plan'}
      <h1 class="ex-display">{$t('exhibit.partnership.title')}</h1>
      <p class="sub">{$t('exhibit.partnership.sub')}</p>
    {:else}
      <h1 class="ex-display">{$t('exhibit.partnership.consentTitle')}</h1>
      <p class="sub">{$t('exhibit.partnership.consentSub')}</p>
    {/if}
  </header>

  <div class="body">
    <div class="main">
      {#if phase === 'plan'}
        <ul class="tasks" in:fade={{ duration: 300 }}>
          {#each sandbox.tasks as task, i (taskKey(task))}
            {@const owner = sandbox.ownerOf(task)}
            <li class="task {task.kind}" class:taken={!!owner} in:fly={{ y: 24, duration: 400, delay: 50 * i }}>
              <span class="kind">{$t(`exhibit.idea.legend.${task.kind}`)}</span>
              <span class="task-label" dir="auto">{label(task)}</span>
              <span class="facts">
                {#if task.kind === 'mission'}
                  {$t('exhibit.partnership.hoursRate', { count: sandbox.hoursOf(task), rate: money(task.rate ?? 0) })}
                  = <b>{money(sandbox.valueOf(task))}</b>
                {:else}
                  {$t('exhibit.partnership.worth', { amount: money(sandbox.valueOf(task)) })}
                {/if}
              </span>
              <div class="owners" role="group" aria-label={$t('exhibit.partnership.whoTakes')}>
                {#each sandbox.circle as id (id)}
                  {@const fits = fitting[taskKey(task)]?.has(id)}
                  <button
                    type="button"
                    class="owner"
                    class:on={owner === id}
                    aria-pressed={owner === id}
                    aria-label={$t('exhibit.partnership.give', { task: label(task), name: nameOf(id) })}
                    title={nameOf(id)}
                    onclick={() => sandbox.assign(task, id)}
                  >
                    <Face hue={hueOf(id)} variant={variantOf(id)} me={id === ME} />
                    {#if fits}<span class="star" title={$t('exhibit.partnership.fits')}>★</span>{/if}
                  </button>
                {/each}
                {#if !owner}<span class="open-tag">{$t('exhibit.partnership.open')}</span>{/if}
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <ul class="answers" in:fade={{ duration: 300 }}>
          {#each sandbox.invited as id, i (id)}
            {@const st = status[id] ?? 'waiting'}
            <li class="answer {st}" in:fly={{ y: 24, duration: 400, delay: 80 * i }}>
              <span class="face"><Face hue={hueOf(id)} variant={variantOf(id)} /></span>
              <div class="answer-body">
                <span class="who" dir="auto">{nameOf(id)}</span>
                <span class="their-parts" dir="auto">
                  {#if sandbox.partsOf(id).length}
                    {sandbox.partsOf(id).map((p) => label(p)).join(' · ')}
                  {:else}
                    {$t('exhibit.partnership.noParts')}
                  {/if}
                </span>
                {#key st}
                  <span class="bubble {st}" in:fly={{ y: 8, duration: 300 }}>{$t(`exhibit.partnership.status.${st}`)}</span>
                {/key}
                {#if talked.includes(id)}
                  <span class="said" dir="auto">“{$t('exhibit.partnership.chatLine')}”</span>
                  {#if st === 'signed' || st === 'silent'}
                    <span class="said soft">{$t('exhibit.partnership.chatDone')}</span>
                  {/if}
                {/if}
                {#if counter && counter.who === id}
                  <span class="said" dir="auto">
                    “{$t('exhibit.partnership.counterLine', { hours: counter.asked, task: label(counter.task), was: counter.was })}”
                  </span>
                {/if}
              </div>
            </li>
          {/each}
        </ul>

        {#if counterOpen && counter}
          <div class="counter" transition:fly={{ y: 30, duration: 350 }}>
            <p class="tip">
              {$t('exhibit.partnership.counterTip', {
                name: nameOf(counter.who),
                from: formatSharePct(counter.from),
                to: formatSharePct(counter.to)
              })}
            </p>
            <div class="row">
              <button type="button" class="ex-btn ex-btn-ghost" onclick={meetHalfway}>
                {$t('exhibit.partnership.meet', { hours: counter.mid })}
              </button>
              <button type="button" class="ex-btn ex-btn-primary" use:focusOnMount onclick={acceptCounter}>
                {$t('exhibit.partnership.accept')}
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <aside class="side">
      <h2>{$t('exhibit.partnership.pieTitle')}</h2>
      {#if slices.length}
        <div class="pie">
          <EquityPie {slices} format={money} size={260} scale={1.75} ariaLabel={$t('exhibit.partnership.pieAria')} />
        </div>
      {:else}
        <p class="pie-empty">{$t('exhibit.partnership.pieEmpty')}</p>
      {/if}
      {#if sandbox.openValue > 0}
        <p class="open-value">{$t('exhibit.partnership.openValue', { amount: money(sandbox.openValue) })}</p>
      {/if}
    </aside>
  </div>

  <footer class="bar">
    {#if phase === 'plan'}
      <div class="assist">
        <button type="button" class="ex-btn ex-btn-ghost" onclick={suggest}>{$t('exhibit.partnership.assist')}</button>
        {#if suggested}<span class="note" in:fade>{$t('exhibit.partnership.assistNote')}</span>{/if}
      </div>
      <button type="button" class="ex-btn ex-btn-primary" disabled={!anyAssigned} title={anyAssigned ? '' : $t('exhibit.partnership.needOne')} onclick={send}>
        {$t('exhibit.partnership.send')}
      </button>
    {:else if phase === 'silence'}
      <div class="silence" in:fade>
        <svg class="clock" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" class="track" />
          <circle cx="32" cy="32" r="26" class="fill" style="animation-duration:{SILENCE_MS}ms" />
        </svg>
        <div>
          <p class="silence-title">{$t('exhibit.partnership.silenceTitle')}</p>
          <p class="silence-rule">{$t('exhibit.partnership.silenceRule')}</p>
        </div>
      </div>
      <span></span>
    {:else if phase === 'signed'}
      <p class="signed-msg" in:fly={{ y: 10, duration: 400 }}>💗 {$t('exhibit.partnership.signed')}</p>
      <button type="button" class="ex-btn ex-btn-primary" use:focusOnMount onclick={() => sandbox.next()}>
        {$t('exhibit.partnership.next')}
        <span class="ltr:-scale-x-100 inline-block" aria-hidden="true">←</span>
      </button>
    {:else}
      <span></span>
    {/if}
  </footer>
</section>

<style>
  .part {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: clamp(0.5rem, 1.5vh, 1.5rem);
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
  .body {
    display: grid;
    grid-template-columns: 1fr clamp(380px, 27vw, 520px);
    gap: clamp(1.25rem, 2.5vw, 3rem);
    min-height: 0;
  }
  .main {
    position: relative;
    min-height: 0;
    display: grid;
    align-content: center;
  }

  /* ── plan ───────────────────────────────────────────────────────── */
  .tasks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(0.75rem, 1.2vw, 1.4rem);
  }
  .task {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 1rem 1.1rem;
    border-radius: 1.4rem;
    background: rgba(255, 255, 255, 0.88);
    border: 3px dashed var(--ex-gold-soft);
    transition:
      border-color 250ms ease,
      box-shadow 250ms ease;
  }
  .task.taken {
    border-style: solid;
    border-color: var(--ex-pink);
    box-shadow: 0 12px 30px rgba(184, 0, 105, 0.1);
  }
  .task.resource.taken {
    border-color: var(--ex-gold);
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
  .task-label {
    font-size: clamp(1.15rem, 1.35vw, 1.65rem);
    font-weight: 800;
    line-height: 1.15;
  }
  .facts {
    font-size: clamp(0.9rem, 1vw, 1.2rem);
    color: var(--ex-ink-soft);
  }
  .facts b {
    color: var(--ex-ink);
  }
  .owners {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.4rem;
  }
  .owner {
    position: relative;
    width: clamp(46px, 3vw, 58px);
    aspect-ratio: 1;
    padding: 0;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px var(--ex-gold-soft);
    background: none;
    cursor: pointer;
    opacity: 0.75;
    transition:
      transform 200ms ease,
      box-shadow 200ms ease,
      opacity 200ms ease;
  }
  .owner:hover {
    transform: scale(1.1);
    opacity: 1;
  }
  .owner.on {
    opacity: 1;
    box-shadow:
      0 0 0 3px var(--ex-pink),
      0 0 0 8px rgba(226, 18, 122, 0.16);
  }
  .star {
    position: absolute;
    top: -8px;
    inset-inline-end: -8px;
    font-size: 1.05rem;
    color: var(--ex-gold);
    text-shadow: 0 0 3px #fff;
  }
  .open-tag {
    margin-inline-start: auto;
    font-size: clamp(0.85rem, 0.9vw, 1.05rem);
    font-weight: 700;
    color: var(--ex-ink-soft);
  }

  /* ── consent ────────────────────────────────────────────────────── */
  .answers {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.1rem;
  }
  .answer {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1.1rem 1.2rem;
    border-radius: 1.6rem;
    background: rgba(255, 255, 255, 0.9);
    border: 3px solid var(--ex-gold-soft);
    transition: border-color 300ms ease;
  }
  .answer.signed,
  .answer.silent {
    border-color: var(--ex-sage);
  }
  .answer.counter {
    border-color: var(--ex-pink);
    box-shadow: 0 0 0 8px rgba(226, 18, 122, 0.1);
  }
  .face {
    flex: 0 0 auto;
    width: clamp(64px, 4.4vw, 84px);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px var(--ex-gold-soft);
  }
  .answer-body {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }
  .who {
    font-size: clamp(1.2rem, 1.35vw, 1.65rem);
    font-weight: 800;
  }
  .their-parts {
    font-size: clamp(0.9rem, 1vw, 1.2rem);
    color: var(--ex-ink-soft);
  }
  .bubble {
    align-self: flex-start;
    padding: 0.25em 0.8em;
    border-radius: 999px;
    font-size: clamp(0.95rem, 1.05vw, 1.25rem);
    font-weight: 800;
    background: var(--ex-gold-soft);
  }
  .bubble.signed {
    background: #dfeadd;
    color: #2f5530;
  }
  .bubble.resent {
    background: #fff3d6;
    color: #7a5a0c;
  }
  .bubble.silent {
    background: #eef3ec;
    color: #4e6b4b;
  }
  .bubble.chat {
    background: #e7eefb;
    color: #24477a;
  }
  .bubble.counter {
    background: var(--ex-pink);
    color: #fff;
  }
  .said {
    font-size: clamp(1rem, 1.1vw, 1.3rem);
    font-weight: 600;
    line-height: 1.3;
  }
  .said.soft {
    font-weight: 400;
    color: var(--ex-ink-soft);
  }
  .counter {
    margin-top: 1.25rem;
    padding: 1.25rem 1.5rem;
    border-radius: 1.6rem;
    background: linear-gradient(135deg, var(--ex-blush), #fff);
    border: 3px solid var(--ex-pink);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .tip {
    margin: 0;
    font-size: clamp(1.1rem, 1.3vw, 1.6rem);
    font-weight: 600;
  }
  .row {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  /* ── side ───────────────────────────────────────────────────────── */
  .side {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 2rem;
    background: rgba(255, 255, 255, 0.7);
    border: 3px solid var(--ex-gold-soft);
    backdrop-filter: blur(6px);
  }
  .side h2 {
    margin: 0;
    font-size: clamp(1.3rem, 1.6vw, 2rem);
    font-weight: 800;
    text-align: center;
  }
  .pie {
    width: 100%;
  }
  .pie :global(.equity-pie) {
    flex-direction: column;
  }
  .pie :global(.legend) {
    width: 100%;
  }
  .pie-empty,
  .open-value {
    margin: 0;
    text-align: center;
    font-size: clamp(1rem, 1.15vw, 1.4rem);
    color: var(--ex-ink-soft);
  }

  /* ── bar ────────────────────────────────────────────────────────── */
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    min-height: 90px;
  }
  .assist {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .note {
    font-size: clamp(1rem, 1.1vw, 1.3rem);
    color: var(--ex-ink-soft);
  }
  .bar :global(.ex-btn:disabled) {
    opacity: 0.4;
    transform: none;
    box-shadow: none;
  }
  .silence {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  .clock {
    width: 72px;
    height: 72px;
    transform: rotate(-90deg);
  }
  .clock .track {
    fill: none;
    stroke: var(--ex-gold-soft);
    stroke-width: 7;
  }
  .clock .fill {
    fill: none;
    stroke: var(--ex-gold);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-dasharray: 164;
    stroke-dashoffset: 164;
    animation: fill-clock linear forwards;
  }
  @keyframes fill-clock {
    to {
      stroke-dashoffset: 0;
    }
  }
  .silence-title {
    margin: 0;
    font-size: clamp(1.2rem, 1.45vw, 1.75rem);
    font-weight: 800;
  }
  .silence-rule {
    margin: 0;
    font-size: clamp(1rem, 1.15vw, 1.4rem);
    color: var(--ex-ink-soft);
  }
  .signed-msg {
    margin: 0;
    font-size: clamp(1.6rem, 2vw, 2.4rem);
    font-weight: 800;
    color: var(--ex-pink-deep);
  }
</style>
