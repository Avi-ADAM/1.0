<script>
  import { t, isRtl } from '$lib/translations';
  import LangSwitch from '$lib/components/onboard/LangSwitch.svelte';
  import { onDestroy } from 'svelte';

  const DEMO_DURATION = 18; // seconds — compressed demo window; real decision time is 48h–1wk (see decisionTime.body)

  function initialDemoState() {
    return {
      nextId: 2,
      rounds: /** @type {any[]} */ ([]),
      current: { id: 1, proposer: 'partner', valuePerHour: 120, hours: 40, noteKey: 'initialNote' },
      timeLeft: DEMO_DURATION,
      signed: false,
      showCounterForm: false,
      counterValue: 120,
      counterHours: 40,
      counterNote: '',
      chatOpen: false,
      chatMessages: /** @type {{from:'you'|'partner', text:string}[]} */ ([]),
      chatDraft: ''
    };
  }

  let demo = $state(initialDemoState());

  const isYou = (/** @type {string} */ p) => p === 'you';
  const proposerLabel = (/** @type {string} */ p) =>
    isYou(p) ? $t('consensus.demo.proposerYou') : $t('consensus.demo.proposerPartner');

  let currentTotal = $derived(demo.current.valuePerHour * demo.current.hours);
  let timePercent = $derived(Math.max(0, Math.min(100, (demo.timeLeft / DEMO_DURATION) * 100)));
  let roundNumber = $derived(demo.rounds.length + 1);
  let canSimulatePartner = $derived(isYou(demo.current.proposer) && !demo.signed);
  let currentNote = $derived(
    demo.current.noteKey ? $t(`consensus.demo.${demo.current.noteKey}`) : (demo.current.note ?? null)
  );

  const statusStyle = {
    approved: 'approved',
    silentApproved: 'silent-approved',
    countered: 'countered'
  };

  let historyDisplay = $derived(
    demo.rounds
      .map((/** @type {any} */ r, /** @type {number} */ i) => ({
        n: i + 1,
        proposerText: proposerLabel(r.proposer),
        valuePerHour: r.valuePerHour,
        hours: r.hours,
        statusText: $t(`consensus.demo.status.${r.status}`),
        statusClass: statusStyle[/** @type {keyof typeof statusStyle} */ (r.status)] || 'countered'
      }))
      .reverse()
  );

  function resolveSilent() {
    if (demo.signed) return;
    demo.rounds = [...demo.rounds, { ...demo.current, status: 'silentApproved' }];
    demo.signed = true;
  }

  function approve() {
    demo.rounds = [...demo.rounds, { ...demo.current, status: 'approved' }];
    demo.signed = true;
  }

  function openCounter() {
    demo.showCounterForm = true;
    demo.counterValue = demo.current.valuePerHour;
    demo.counterHours = demo.current.hours;
    demo.counterNote = '';
  }
  function cancelCounter() {
    demo.showCounterForm = false;
  }

  function submitCounter() {
    demo.rounds = [...demo.rounds, { ...demo.current, status: 'countered' }];
    demo.current = {
      id: demo.nextId,
      proposer: 'you',
      valuePerHour: Math.max(1, Number(demo.counterValue) || demo.current.valuePerHour),
      hours: Math.max(1, Number(demo.counterHours) || demo.current.hours),
      noteKey: null,
      note: demo.counterNote && demo.counterNote.trim() ? demo.counterNote.trim() : null
    };
    demo.nextId += 1;
    demo.timeLeft = DEMO_DURATION;
    demo.showCounterForm = false;
    demo.chatOpen = false;
    demo.chatMessages = [];
  }

  function partnerCounter() {
    demo.rounds = [...demo.rounds, { ...demo.current, status: 'countered' }];
    demo.current = {
      id: demo.nextId,
      proposer: 'partner',
      valuePerHour: Math.max(1, demo.current.valuePerHour - 10),
      hours: demo.current.hours,
      noteKey: 'partnerCounterNote'
    };
    demo.nextId += 1;
    demo.timeLeft = DEMO_DURATION;
    demo.chatOpen = false;
    demo.chatMessages = [];
  }

  function skipWait() {
    demo.timeLeft = 0;
    resolveSilent();
  }

  function toggleChat() {
    demo.chatOpen = !demo.chatOpen;
  }

  let chatTimeout;
  function sendChat() {
    const text = (demo.chatDraft || '').trim();
    if (!text) return;
    demo.chatMessages = [...demo.chatMessages, { from: 'you', text }];
    demo.chatDraft = '';
    clearTimeout(chatTimeout);
    chatTimeout = setTimeout(() => {
      const reply =
        demo.chatMessages.length % 2 === 0
          ? $t('consensus.demo.chat.reply1')
          : $t('consensus.demo.chat.reply2');
      demo.chatMessages = [...demo.chatMessages, { from: 'partner', text: reply }];
    }, 1600);
  }
  function chatKeyDown(/** @type {KeyboardEvent} */ e) {
    if (e.key === 'Enter') sendChat();
  }

  function restartDemo() {
    demo = initialDemoState();
  }

  const tickInterval = setInterval(() => {
    if (demo.signed || demo.timeLeft <= 0) return;
    demo.timeLeft -= 1;
    if (demo.timeLeft <= 0) resolveSilent();
  }, 1000);

  onDestroy(() => {
    clearInterval(tickInterval);
    clearTimeout(chatTimeout);
  });
</script>

<svelte:head>
  <title>{$t('consensus.hero.kicker')} · 1lev1</title>
</svelte:head>

<div class="consensus-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="cp-header">
    <div class="cp-brand">
      <img src="/coin-logo.png" alt="" class="cp-brand-logo" />
      <span>{$t('consensus.nav.brand')}</span>
    </div>
    <nav class="cp-nav">
      <a class="cp-link" href="/hascama">{$t('consensus.nav.philosophy')}</a>
      <a class="cp-link" href="/wish/new">{$t('consensus.nav.practical')}</a>
      <LangSwitch />
    </nav>
  </header>

  <section class="cp-hero">
    <div class="cp-kicker cp-kicker--pink">{$t('consensus.hero.kicker')}</div>
    <h1 class="cp-hero-title">{$t('consensus.hero.title')}</h1>
    <p class="cp-hero-subtitle">{$t('consensus.hero.subtitle')}</p>
    <div class="cp-hero-actions">
      <a href="#demo" class="cp-action-card cp-action-card--gold">
        <span class="cp-action-label">✅ {$t('consensus.hero.action1.label')}</span>
        <span class="cp-action-desc">{$t('consensus.hero.action1.desc')}</span>
      </a>
      <a href="#demo" class="cp-action-card cp-action-card--cyan">
        <span class="cp-action-label cp-action-label--blue">💬 {$t('consensus.hero.action2.label')}</span>
        <span class="cp-action-desc">{$t('consensus.hero.action2.desc')}</span>
      </a>
      <a href="#demo" class="cp-action-card cp-action-card--pink">
        <span class="cp-action-label cp-action-label--pink">🔄 {$t('consensus.hero.action3.label')}</span>
        <span class="cp-action-desc">{$t('consensus.hero.action3.desc')}</span>
      </a>
    </div>
  </section>

  <section class="cp-decision-time">
    <div class="cp-decision-copy">
      <div class="cp-kicker cp-kicker--gold">{$t('consensus.decisionTime.kicker')}</div>
      <h2 class="cp-h2">{$t('consensus.decisionTime.title')}</h2>
      <p class="cp-body-text">{$t('consensus.decisionTime.body')}</p>
    </div>
    <div class="cp-ring-wrap">
      <svg width="180" height="180" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" class="cp-ring-track" />
        <circle cx="60" cy="60" r="52" class="cp-ring-fill" />
      </svg>
      <div class="cp-ring-label">
        <span class="cp-ring-emoji">🤝</span>
        <span class="cp-ring-result">{$t('consensus.decisionTime.ringResult')}</span>
      </div>
    </div>
  </section>

  <section id="demo" class="cp-demo-section">
    <div class="cp-demo-heading">
      <div class="cp-kicker cp-kicker--pink">{$t('consensus.demo.kicker')}</div>
      <h2 class="cp-h2">{$t('consensus.demo.title')}</h2>
      <p class="cp-demo-subtitle">{$t('consensus.demo.subtitle')}</p>
    </div>

    <div class="cp-demo-frame">
      <div class="cp-demo-inner">
        {#if demo.signed}
          <div class="cp-signed">
            <div class="cp-signed-emoji">✍️</div>
            <div class="cp-signed-title">{$t('consensus.demo.signed.title')}</div>
            <p class="cp-signed-body">{$t('consensus.demo.signed.body')}</p>
            <div class="cp-signed-summary">
              {proposerLabel(demo.current.proposer)} · {demo.current.valuePerHour} {$t('consensus.demo.perHourUnit')} × {demo.current.hours} {$t('consensus.demo.hoursUnit')} = {currentTotal}
            </div>
            <button type="button" class="cp-btn cp-btn--gold" onclick={restartDemo}>
              {$t('consensus.demo.signed.restart')}
            </button>
          </div>
        {:else}
          <div class="cp-round">
            <div class="cp-round-head">
              <span class="cp-round-meta">
                {$t('consensus.demo.roundLabel')} {roundNumber} · {proposerLabel(demo.current.proposer)}
              </span>
              <span class="cp-round-timer">{demo.timeLeft}s</span>
            </div>
            <div class="cp-round-total">
              {demo.current.valuePerHour} {$t('consensus.demo.perHourUnit')} × {demo.current.hours} {$t('consensus.demo.hoursUnit')} = {currentTotal}
            </div>
            {#if currentNote}
              <p class="cp-round-note">{currentNote}</p>
            {/if}
            <div class="cp-progress-track">
              <div class="cp-progress-fill" style="width:{timePercent}%"></div>
            </div>
            <div class="cp-window-row">
              <span class="cp-window-note">
                {$t('consensus.demo.windowLabel')}: {demo.timeLeft}s — {$t('consensus.demo.windowNote')}
              </span>
              <button type="button" class="cp-skip-link" onclick={skipWait}>{$t('consensus.demo.skip')}</button>
            </div>

            <div class="cp-round-actions">
              <button type="button" class="cp-btn cp-btn--wow" onclick={approve}>
                ✅ {$t('consensus.demo.actions.approve')}
              </button>
              <button type="button" class="cp-btn cp-btn--cyan" onclick={toggleChat}>
                💬 {$t('consensus.demo.actions.discuss')}
              </button>
              <button type="button" class="cp-btn cp-btn--pink" onclick={openCounter}>
                🔄 {$t('consensus.demo.actions.counter')}
              </button>
            </div>

            {#if canSimulatePartner}
              <button type="button" class="cp-simulate-btn" onclick={partnerCounter}>
                {$t('consensus.demo.simulatePartnerCounter')}
              </button>
            {/if}

            {#if demo.showCounterForm}
              <div class="cp-counter-form">
                <div class="cp-counter-title">{$t('consensus.demo.counterForm.title')}</div>
                <div class="cp-counter-fields">
                  <label class="cp-field">
                    {$t('consensus.demo.counterForm.perHourLabel')}
                    <input type="number" bind:value={demo.counterValue} />
                  </label>
                  <label class="cp-field">
                    {$t('consensus.demo.counterForm.hoursLabel')}
                    <input type="number" bind:value={demo.counterHours} />
                  </label>
                </div>
                <label class="cp-field cp-field--full">
                  {$t('consensus.demo.counterForm.noteLabel')}
                  <textarea
                    bind:value={demo.counterNote}
                    placeholder={$t('consensus.demo.counterForm.notePlaceholder')}
                    rows="2"
                  ></textarea>
                </label>
                <div class="cp-counter-buttons">
                  <button type="button" class="cp-btn cp-btn--pink" onclick={submitCounter}>
                    {$t('consensus.demo.counterForm.submit')}
                  </button>
                  <button type="button" class="cp-btn cp-btn--ghost" onclick={cancelCounter}>
                    {$t('consensus.demo.counterForm.cancel')}
                  </button>
                </div>
              </div>
            {/if}

            {#if demo.chatOpen}
              <div class="cp-chat">
                <div class="cp-chat-messages">
                  {#each demo.chatMessages as m, i (i)}
                    <div class="cp-chat-bubble" class:cp-chat-bubble--you={isYou(m.from)}>
                      <strong>{proposerLabel(m.from)}</strong>{m.text}
                    </div>
                  {/each}
                </div>
                <div class="cp-chat-input-row">
                  <input
                    class="cp-chat-input"
                    bind:value={demo.chatDraft}
                    onkeydown={chatKeyDown}
                    placeholder={$t('consensus.demo.chat.placeholder')}
                  />
                  <button type="button" class="cp-btn cp-btn--cyan" onclick={sendChat}>
                    {$t('consensus.demo.chat.send')}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <div class="cp-history">
          <div class="cp-history-title">{$t('consensus.demo.history.title')}</div>
          {#if demo.rounds.length === 0}
            <p class="cp-history-empty">{$t('consensus.demo.history.empty')}</p>
          {/if}
          <div class="cp-history-list">
            {#each historyDisplay as r (r.n)}
              <div class="cp-history-row">
                <span>
                  {$t('consensus.demo.roundLabel')} {r.n} · {r.proposerText} · {r.valuePerHour} {$t('consensus.demo.perHourUnit')} × {r.hours} {$t('consensus.demo.hoursUnit')}
                </span>
                <span class="cp-history-badge cp-history-badge--{r.statusClass}">{r.statusText}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="cp-links">
    <a href="/hascama" class="cp-link-card cp-link-card--gold">
      <div class="cp-link-title cp-link-title--gold">{$t('consensus.links.philTitle')}</div>
      <p class="cp-link-body">{$t('consensus.links.philBody')}</p>
      <span class="cp-link-cta cp-link-cta--gold">{$t('consensus.links.philCta')} {$isRtl ? '←' : '→'}</span>
    </a>
    <a href="/wish/new" class="cp-link-card cp-link-card--pink">
      <div class="cp-link-title cp-link-title--pink">{$t('consensus.links.pracTitle')}</div>
      <p class="cp-link-body">{$t('consensus.links.pracBody')}</p>
      <span class="cp-link-cta cp-link-cta--pink">{$t('consensus.links.pracCta')} {$isRtl ? '←' : '→'}</span>
    </a>
  </section>

  <footer class="cp-footer">{$t('consensus.footer')}</footer>
</div>

<style>
  .consensus-page {
    --cp-gold: var(--gold);
    --cp-gold-lighter: #f0c040;
    --cp-gold-deep: var(--gre);
    --cp-gold-shadow: var(--stgold);
    --cp-gold-gra: var(--gra);
    --cp-gold-grc: var(--grc);
    --cp-barbi: var(--barbi-pink);
    --cp-pink: #c8155f;
    --cp-cyan-l: var(--lturk);
    --cp-cyan-m: var(--mturk);
    --cp-blue-deep: var(--blu);
    --cp-wow: var(--wow);
    --cp-wow-bright: var(--wow2);
    --cp-radius-lg: 22px;
    --cp-shadow-gold: 2px 2px 0.5em rgba(122, 98, 0, 0.55), inset 1px 1px 0 rgba(255, 255, 255, 0.9),
      inset -1px -1px 0 rgba(0, 0, 0, 0.34);
    --cp-shadow-pink: 0 4px 20px rgba(200, 21, 95, 0.35);

    min-height: 100vh;
    background: linear-gradient(135deg, #f6e9c9 0%, #fbeef3 45%, #eee0f7 100%);
    color: #2a2118;
    overflow-x: hidden;
  }

  .cp-header {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 28px;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(200, 150, 12, 0.22);
  }
  .cp-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.16em;
    font-size: 15px;
    color: var(--cp-gold-shadow);
    font-weight: 600;
  }
  .cp-brand-logo {
    width: 34px;
    height: 34px;
    object-fit: contain;
    border-radius: 50%;
  }
  .cp-nav {
    display: flex;
    align-items: center;
    gap: 22px;
    font-size: 14px;
  }
  .cp-link {
    text-decoration: none;
    font-weight: 600;
    color: var(--cp-pink);
  }
  .cp-link:hover {
    color: var(--cp-gold-deep);
  }

  .cp-hero {
    max-width: 1000px;
    margin: 0 auto;
    padding: 90px 28px 60px;
    text-align: center;
  }
  .cp-kicker {
    font-size: 13px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 14px;
  }
  .cp-kicker--pink {
    color: var(--cp-pink);
  }
  .cp-kicker--gold {
    color: var(--cp-gold-deep);
  }
  .cp-hero-title {
    font-family: var(--bal);
    font-size: clamp(2.4rem, 6vw, 4.6rem);
    line-height: 1.08;
    margin: 0 0 22px;
    background: linear-gradient(90deg, var(--cp-gold-gra), var(--cp-pink), var(--cp-gold-deep));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .cp-hero-subtitle {
    max-width: 640px;
    margin: 0 auto 40px;
    font-size: 19px;
    line-height: 1.7;
    color: #4a3d2c;
  }
  .cp-hero-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .cp-action-card {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 150px;
    padding: 16px 22px;
    border-radius: var(--cp-radius-lg);
    background: rgba(255, 255, 255, 0.55);
    transition: transform 160ms ease;
  }
  .cp-action-card:hover {
    transform: translateY(-2px);
  }
  .cp-action-card--gold {
    border: 2px solid var(--cp-gold-lighter);
    box-shadow: var(--cp-shadow-gold);
  }
  .cp-action-card--cyan {
    border: 2px solid var(--cp-cyan-m);
    box-shadow: 0 4px 20px rgba(34, 211, 238, 0.25);
  }
  .cp-action-card--pink {
    border: 2px solid var(--cp-barbi);
    box-shadow: var(--cp-shadow-pink);
  }
  .cp-action-label {
    font-family: var(--bal);
    font-size: 20px;
    color: var(--cp-gold-shadow);
  }
  .cp-action-label--blue {
    color: var(--cp-blue-deep);
  }
  .cp-action-label--pink {
    color: var(--cp-pink);
  }
  .cp-action-desc {
    font-size: 13px;
    color: #6b5c47;
  }

  .cp-decision-time {
    max-width: 1040px;
    margin: 0 auto;
    padding: 40px 28px 80px;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 48px;
    align-items: center;
  }
  .cp-h2 {
    font-family: var(--bal);
    font-size: clamp(1.8rem, 3.4vw, 2.6rem);
    margin: 0 0 16px;
    color: #3a2c1a;
  }
  .cp-body-text {
    font-size: 17px;
    line-height: 1.75;
    color: #4a3d2c;
    margin: 0;
  }
  .cp-ring-wrap {
    display: flex;
    justify-content: center;
    position: relative;
  }
  .cp-ring-track {
    stroke: rgba(200, 150, 12, 0.16);
    stroke-width: 9;
    fill: none;
  }
  .cp-ring-fill {
    stroke: var(--cp-gold-lighter);
    stroke-width: 9;
    fill: none;
    stroke-linecap: round;
    stroke-dasharray: 327;
    transform-origin: 60px 60px;
    transform: rotate(-90deg);
    animation: cp-decision-fill 8s linear infinite;
  }
  .cp-ring-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 2px;
    animation: cp-decision-label 8s linear infinite;
  }
  .cp-ring-emoji {
    font-size: 26px;
  }
  .cp-ring-result {
    font-family: var(--bal);
    font-size: 15px;
    color: var(--cp-gold-shadow);
    font-weight: 700;
  }
  @keyframes cp-decision-fill {
    0% {
      stroke-dashoffset: 327;
    }
    88% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
  @keyframes cp-decision-label {
    0%,
    84% {
      opacity: 0;
      transform: scale(0.9);
    }
    92%,
    97% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.9);
    }
  }

  .cp-demo-section {
    max-width: 1040px;
    margin: 0 auto;
    padding: 20px 28px 90px;
  }
  .cp-demo-heading {
    text-align: center;
    margin-bottom: 32px;
  }
  .cp-demo-subtitle {
    max-width: 600px;
    margin: 0 auto;
    font-size: 16px;
    line-height: 1.7;
    color: #4a3d2c;
  }
  .cp-demo-frame {
    position: relative;
    border-radius: 28px;
    background: #0e0d0c;
    padding: 2px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  }
  .cp-demo-inner {
    position: relative;
    border-radius: 26px;
    overflow: hidden;
    background: #0e0d0c;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .cp-demo-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(ellipse 70% 50% at 15% 0%, rgba(200, 150, 12, 0.14) 0%, transparent 55%),
      radial-gradient(ellipse 55% 60% at 85% 100%, rgba(200, 21, 95, 0.13) 0%, transparent 55%);
  }
  .cp-signed,
  .cp-round,
  .cp-history {
    position: relative;
    z-index: 1;
  }

  .cp-signed {
    text-align: center;
    padding: 36px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .cp-signed-emoji {
    font-size: 44px;
  }
  .cp-signed-title {
    font-family: var(--bal);
    font-size: 26px;
    color: var(--cp-gold-lighter);
  }
  .cp-signed-body {
    max-width: 440px;
    color: #c9bfae;
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  }
  .cp-signed-summary {
    margin-top: 8px;
    padding: 14px 22px;
    border-radius: 16px;
    border: 1px solid rgba(238, 232, 170, 0.35);
    background: rgba(238, 232, 170, 0.06);
    color: #ede5d8;
    font-size: 14px;
  }

  .cp-round {
    border-radius: 20px;
    border: 1px solid rgba(238, 232, 170, 0.3);
    background: rgba(255, 255, 255, 0.03);
    padding: 22px;
    animation: cp-glow-pulse 3.5s ease-in-out infinite;
  }
  @keyframes cp-glow-pulse {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(238, 232, 170, 0.35), 0 0 40px rgba(238, 232, 170, 0.2);
    }
    50% {
      box-shadow: 0 0 28px rgba(238, 232, 170, 0.55), 0 0 55px rgba(238, 232, 170, 0.32);
    }
  }
  .cp-round-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
  }
  .cp-round-meta {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9a8f80;
    font-weight: 700;
  }
  .cp-round-timer {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--cp-gold-lighter);
  }
  .cp-round-total {
    font-family: var(--bal);
    font-size: 22px;
    color: #ede5d8;
    margin-bottom: 8px;
  }
  .cp-round-note {
    margin: 0 0 16px;
    color: #c9bfae;
    font-size: 14px;
    line-height: 1.6;
  }
  .cp-progress-track {
    height: 8px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
    margin-bottom: 8px;
  }
  .cp-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--cp-gold-gra), var(--cp-gold-lighter));
    transition: width 0.9s linear;
  }
  .cp-window-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .cp-window-note {
    font-size: 12px;
    color: #8a7f70;
  }
  .cp-skip-link {
    border: none;
    background: none;
    cursor: pointer;
    color: #f472b6;
    font-size: 12px;
    font-weight: 700;
    text-decoration: underline;
  }
  .cp-round-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  .cp-btn {
    flex: 1;
    min-width: 120px;
    border: none;
    cursor: pointer;
    padding: 12px 16px;
    border-radius: 14px;
    font-family: var(--bal);
    font-size: 15px;
    transition: transform 160ms ease;
  }
  .cp-btn:hover {
    transform: translateY(-2px);
  }
  .cp-btn--wow {
    background: linear-gradient(135deg, var(--cp-wow), var(--cp-wow-bright));
    color: #04372f;
    box-shadow: 0 4px 16px rgba(2, 255, 187, 0.28);
  }
  .cp-btn--cyan {
    background: linear-gradient(135deg, var(--cp-cyan-l), var(--cp-cyan-m));
    color: #04372f;
    box-shadow: 0 4px 16px rgba(34, 211, 238, 0.25);
  }
  .cp-btn--pink {
    background: linear-gradient(135deg, var(--cp-barbi), var(--cp-pink));
    color: #fff;
    box-shadow: var(--cp-shadow-pink);
  }
  .cp-btn--gold {
    background: linear-gradient(135deg, var(--cp-gold-gra), var(--cp-gold-grc));
    color: #3a2c1a;
    box-shadow: var(--cp-shadow-gold);
    margin-top: 10px;
    border-radius: 999px;
    padding: 12px 26px;
    flex: none;
  }
  .cp-btn--ghost {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: none;
    color: #c9bfae;
    box-shadow: none;
    flex: none;
    border-radius: 12px;
  }
  .cp-simulate-btn {
    margin-top: 12px;
    border: 1px dashed rgba(238, 232, 170, 0.4);
    background: none;
    cursor: pointer;
    color: #c9bfae;
    font-size: 12.5px;
    padding: 8px 14px;
    border-radius: 999px;
  }

  .cp-counter-form {
    margin-top: 18px;
    padding: 18px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 0, 146, 0.25);
  }
  .cp-counter-title {
    font-family: var(--bal);
    font-size: 16px;
    color: #ede5d8;
    margin-bottom: 12px;
  }
  .cp-counter-fields {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .cp-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #9a8f80;
    margin-bottom: 14px;
  }
  .cp-field--full {
    width: 100%;
  }
  .cp-field input,
  .cp-field textarea {
    width: 120px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: #171512;
    color: #ede5d8;
    font-size: 14px;
    font-family: inherit;
  }
  .cp-field--full textarea {
    width: 100%;
    resize: vertical;
  }
  .cp-counter-buttons {
    display: flex;
    gap: 10px;
  }

  .cp-chat {
    margin-top: 18px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(34, 211, 238, 0.06);
    border: 1px solid rgba(34, 211, 238, 0.25);
  }
  .cp-chat-messages {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    max-height: 160px;
    overflow-y: auto;
  }
  .cp-chat-bubble {
    align-self: flex-start;
    max-width: 80%;
    padding: 8px 12px;
    border-radius: 14px;
    background: rgba(34, 211, 238, 0.14);
    color: #c9f4fb;
    font-size: 13.5px;
  }
  .cp-chat-bubble--you {
    align-self: flex-end;
    background: rgba(255, 0, 146, 0.16);
    color: #ffd6ec;
  }
  .cp-chat-bubble strong {
    opacity: 0.7;
    font-size: 11px;
    display: block;
    margin-bottom: 2px;
  }
  .cp-chat-input-row {
    display: flex;
    gap: 8px;
  }
  .cp-chat-input {
    flex: 1;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: #171512;
    color: #ede5d8;
    font-size: 14px;
  }

  .cp-history-title {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9a8f80;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .cp-history-empty {
    color: #6b6255;
    font-size: 13.5px;
    margin: 0;
  }
  .cp-history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cp-history-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
    color: #c9bfae;
  }
  .cp-history-badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
  }
  .cp-history-badge--approved {
    background: rgba(2, 255, 187, 0.15);
    color: #02ffbb;
  }
  .cp-history-badge--silent-approved {
    background: rgba(238, 232, 170, 0.18);
    color: #eee8aa;
  }
  .cp-history-badge--countered {
    background: rgba(255, 0, 146, 0.15);
    color: #ff8fc4;
  }

  .cp-links {
    max-width: 1040px;
    margin: 0 auto;
    padding: 0 28px 90px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .cp-link-card {
    text-decoration: none;
    display: block;
    padding: 28px;
    border-radius: var(--cp-radius-lg);
    background: rgba(255, 255, 255, 0.55);
    transition: transform 160ms ease;
  }
  .cp-link-card:hover {
    transform: translateY(-2px);
  }
  .cp-link-card--gold {
    border: 2px solid var(--cp-gold-lighter);
    box-shadow: var(--cp-shadow-gold);
  }
  .cp-link-card--pink {
    border: 2px solid var(--cp-barbi);
    box-shadow: var(--cp-shadow-pink);
  }
  .cp-link-title {
    font-family: var(--bal);
    font-size: 21px;
    margin-bottom: 8px;
  }
  .cp-link-title--gold {
    color: var(--cp-gold-shadow);
  }
  .cp-link-title--pink {
    color: var(--cp-pink);
  }
  .cp-link-body {
    font-size: 14.5px;
    line-height: 1.6;
    color: #5c4d38;
    margin: 0 0 14px;
  }
  .cp-link-cta {
    font-weight: 700;
    font-size: 14px;
  }
  .cp-link-cta--gold {
    color: var(--cp-gold-deep);
  }
  .cp-link-cta--pink {
    color: var(--cp-pink);
  }

  .cp-footer {
    text-align: center;
    padding: 30px 20px 46px;
    font-size: 13px;
    color: #7a6a52;
    letter-spacing: 0.04em;
  }

  @media (max-width: 720px) {
    .cp-decision-time {
      grid-template-columns: 1fr;
    }
    .cp-links {
      grid-template-columns: 1fr;
    }
  }
</style>
