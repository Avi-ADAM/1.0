<script>
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { fly, fade } from 'svelte/transition';

  let activeTab = $state('platform'); // 'platform' | 'agreement'
  let expandedFaq = $state(null);

  function toggleFaq(id) {
    expandedFaq = expandedFaq === id ? null : id;
  }

  const faqs = [
    {
      id: 'what-is-1lev1',
      q: $t('home.maze.faq.q1'),
      a: $t('home.maze.faq.a1')
    },
    {
      id: 'what-is-rikma',
      q: $t('home.maze.faq.q2'),
      a: $t('home.maze.faq.a2')
    },
    {
      id: 'what-is-agreement',
      q: $t('home.maze.faq.q3'),
      a: $t('home.maze.faq.a3')
    },
    { id: 'two-sites', q: $t('home.maze.faq.q4'), a: $t('home.maze.faq.a4') },
    {
      id: 'basic-vs-full',
      q: $t('home.maze.faq.q5'),
      a: $t('home.maze.faq.a5')
    },
    {
      id: 'after-register',
      q: $t('home.maze.faq.q6'),
      a: $t('home.maze.faq.a6')
    }
  ];
</script>

<div class="maze-wrapper" dir={$lang === 'en' ? 'ltr' : 'rtl'}>
  <!-- Header -->
  <div class="maze-header">
    <div class="header-icon">💗</div>
    <h2 class="maze-title">{$t('home.maze.title')}</h2>
    <p class="maze-subtitle">{$t('home.maze.subtitle')}</p>
  </div>

  <!-- Tab Navigation -->
  <div class="tabs">
    <button
      class="tab-btn"
      class:active={activeTab === 'platform'}
      onclick={() => (activeTab = 'platform')}
    >
      <span class="tab-icon">🏗️</span>
      {$t('home.maze.tabs.platform')}
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'agreement'}
      onclick={() => (activeTab = 'agreement')}
    >
      <span class="tab-icon">🌍</span>
      {$t('home.maze.tabs.agreement')}
    </button>
  </div>

  <!-- Platform Tab -->
  {#if activeTab === 'platform'}
    <div class="tab-content" in:fly={{ x: -20, duration: 400 }}>
      <!-- Site cards -->
      <div class="sites-grid">
        <div class="site-card site-platform">
          <div class="site-card-header">
            <div class="site-badge platform-badge">
              <span>1💗1</span>
            </div>
            <h3>{$t('home.maze.platform.name')}</h3>
            <a href="https://1lev1.com" target="_blank" class="site-url"
              >1lev1.com</a
            >
          </div>
          <p class="site-desc">{$t('home.maze.platform.desc')}</p>
          <ul class="feature-list">
            <li>✦ {$t('home.maze.platform.f1')}</li>
            <li>✦ {$t('home.maze.platform.f2')}</li>
            <li>✦ {$t('home.maze.platform.f3')}</li>
            <li>✦ {$t('home.maze.platform.f4')}</li>
          </ul>
        </div>

        <div class="site-card site-agreement">
          <div class="site-card-header">
            <div class="site-badge agreement-badge-icon">
              <span>🌍</span>
            </div>
            <h3>{$t('home.maze.agreementSite.name')}</h3>
            <a
              href="https://agreement.1lev1.com"
              target="_blank"
              class="site-url">agreement.1lev1.com</a
            >
          </div>
          <p class="site-desc">{$t('home.maze.agreementSite.desc')}</p>
          <ul class="feature-list">
            <li>✦ {$t('home.maze.agreementSite.f1')}</li>
            <li>✦ {$t('home.maze.agreementSite.f2')}</li>
            <li>✦ {$t('home.maze.agreementSite.f3')}</li>
            <li>✦ {$t('home.maze.agreementSite.f4')}</li>
          </ul>
        </div>
      </div>

      <!-- What is a Rikma -->
      <div class="info-block">
        <div class="info-block-icon">🧵</div>
        <div>
          <h4>{$t('home.maze.rikma.title')}</h4>
          <p>{$t('home.maze.rikma.desc')}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Agreement Tab -->
  {#if activeTab === 'agreement'}
    <div class="tab-content" in:fly={{ x: 20, duration: 400 }}>
      <!-- Flow -->
      <div class="flow-section">
        <h3 class="flow-title">{$t('home.maze.flow.title')}</h3>
        <div class="flow-steps">
          <div class="flow-step">
            <div class="step-num">1</div>
            <div class="step-body">
              <strong>{$t('home.maze.flow.s1.title')}</strong>
              <span>{$t('home.maze.flow.s1.desc')}</span>
            </div>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="flow-step">
            <div class="step-num">2</div>
            <div class="step-body">
              <strong>{$t('home.maze.flow.s2.title')}</strong>
              <span>{$t('home.maze.flow.s2.desc')}</span>
            </div>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="flow-step">
            <div class="step-num">3</div>
            <div class="step-body">
              <strong>{$t('home.maze.flow.s3.title')}</strong>
              <span>{$t('home.maze.flow.s3.desc')}</span>
            </div>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="flow-step step-final">
            <div class="step-num gold">🎉</div>
            <div class="step-body">
              <strong>{$t('home.maze.flow.s4.title')}</strong>
              <span>{$t('home.maze.flow.s4.desc')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Two agreement options comparison -->
      <h3 class="compare-title">{$t('home.maze.compare.title')}</h3>
      <div class="compare-grid">
        <div class="compare-card basic-card">
          <div class="compare-icon">✅</div>
          <h4>{$t('home.maze.compare.basic.title')}</h4>
          <p class="compare-scope">{$t('home.maze.compare.basic.scope')}</p>
          <p class="compare-desc">{$t('home.maze.compare.basic.desc')}</p>
          <div class="compare-footer basic-footer">
            {$t('home.maze.compare.basic.cta')}
          </div>
        </div>

        <div class="compare-card full-card">
          <div class="compare-icon">✨</div>
          <h4>{$t('home.maze.compare.full.title')}</h4>
          <p class="compare-scope">{$t('home.maze.compare.full.scope')}</p>
          <p class="compare-desc">{$t('home.maze.compare.full.desc')}</p>
          <a
            href="https://agreement.1lev1.com"
            target="_blank"
            class="compare-footer full-footer"
          >
            {$t('home.maze.compare.full.cta')} ←
          </a>
        </div>
      </div>
    </div>
  {/if}

  <!-- FAQ Section – always visible -->
  <div class="faq-section">
    <h3 class="faq-title">❓ {$t('home.maze.faq.title')}</h3>
    {#each faqs as faq}
      <div class="faq-item" class:open={expandedFaq === faq.id}>
        <button class="faq-q" onclick={() => toggleFaq(faq.id)}>
          <span>{faq.q}</span>
          <span class="faq-chevron">{expandedFaq === faq.id ? '▲' : '▼'}</span>
        </button>
        {#if expandedFaq === faq.id}
          <div class="faq-a" in:fly={{ y: -8, duration: 250 }}>
            {faq.a}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap');

  .maze-wrapper {
    font-family: 'Rubik', sans-serif;
    background: linear-gradient(160deg, #1a0a2e 0%, #2d1522 60%, #1a0a2e 100%);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    max-width: 720px;
    margin: 0 auto;
    color: white;
    overflow-y: auto;
    max-height: 75vh;
    position: relative;
  }

  /* Subtle star dots */
  .maze-wrapper::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    pointer-events: none;
    background-image:
      radial-gradient(1px 1px at 15% 20%, #ffd700 0%, transparent 100%),
      radial-gradient(1px 1px at 80% 15%, #ff00ae 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 70%, #ffd700 0%, transparent 100%),
      radial-gradient(1px 1px at 70% 80%, #ff00ae 0%, transparent 100%),
      radial-gradient(1px 1px at 25% 90%, #ffd700 0%, transparent 100%),
      radial-gradient(1px 1px at 90% 50%, #ffd700 0%, transparent 100%);
    animation: starsTwinkle 4s ease-in-out infinite alternate;
  }

  @keyframes starsTwinkle {
    from {
      opacity: 0.4;
    }
    to {
      opacity: 1;
    }
  }

  /* Header */
  .maze-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header-icon {
    font-size: 2.8rem;
    display: block;
    margin-bottom: 0.5rem;
    animation: heartbeat 2.4s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%,
    100% {
      transform: scale(1);
    }
    15% {
      transform: scale(1.15);
    }
    30% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.1);
    }
    60% {
      transform: scale(1);
    }
  }

  .maze-title {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 0.4rem;
    background: linear-gradient(135deg, #ff00ae, #ffb800, #ffd700, #ff00ae);
    background-size: 250% 250%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradShift 5s ease infinite;
  }

  @keyframes gradShift {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .maze-subtitle {
    color: rgba(255, 255, 255, 0.65);
    font-size: 1rem;
    margin: 0;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.75rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 14px;
    padding: 0.4rem;
  }

  .tab-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.55);
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .tab-btn.active {
    background: linear-gradient(
      135deg,
      rgba(255, 0, 174, 0.35),
      rgba(255, 184, 0, 0.35)
    );
    color: white;
    box-shadow: 0 2px 16px rgba(255, 0, 174, 0.25);
  }

  .tab-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.07);
    color: white;
  }

  .tab-icon {
    font-size: 1.1rem;
  }

  /* Tab Content */
  .tab-content {
    margin-bottom: 2rem;
  }

  /* Site Cards */
  .sites-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .site-card {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .site-card:hover {
    transform: translateY(-4px);
  }

  .site-platform:hover {
    box-shadow: 0 8px 30px rgba(255, 0, 174, 0.25);
    border-color: rgba(255, 0, 174, 0.35);
  }

  .site-agreement:hover {
    box-shadow: 0 8px 30px rgba(255, 184, 0, 0.25);
    border-color: rgba(255, 184, 0, 0.35);
  }

  .site-card-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .site-badge {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0 auto 0.6rem;
  }

  .platform-badge {
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    box-shadow: 0 4px 18px rgba(255, 0, 174, 0.35);
  }

  .agreement-badge-icon {
    background: linear-gradient(135deg, #ffb800, #ffd700);
    box-shadow: 0 4px 18px rgba(255, 184, 0, 0.35);
  }

  .site-card h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: white;
  }

  .site-url {
    font-size: 0.78rem;
    color: rgba(255, 184, 0, 0.8);
    text-decoration: none;
    transition: color 0.2s;
  }

  .site-url:hover {
    color: #ffd700;
  }

  .site-desc {
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin: 0 0 1rem;
  }

  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .feature-list li {
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.5;
  }

  /* Info Block (Rikma) */
  .info-block {
    background: rgba(255, 184, 0, 0.08);
    border: 1px solid rgba(255, 184, 0, 0.25);
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .info-block-icon {
    font-size: 1.8rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .info-block h4 {
    font-size: 1rem;
    font-weight: 700;
    color: #ffd700;
    margin: 0 0 0.4rem;
  }

  .info-block p {
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.7;
    margin: 0;
  }

  /* Flow */
  .flow-title,
  .compare-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffb800;
    margin: 0 0 1.25rem;
    text-align: center;
  }

  .flow-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 2rem;
  }

  .flow-step {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    transition: border-color 0.3s;
  }

  .flow-step:hover {
    border-color: rgba(255, 0, 174, 0.35);
  }
  .step-final {
    border-color: rgba(255, 184, 0, 0.35);
  }

  .flow-arrow {
    text-align: center;
    color: rgba(255, 255, 255, 0.3);
    font-size: 1.2rem;
    line-height: 1;
    padding: 0.3rem 0;
  }

  .step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 800;
    flex-shrink: 0;
    color: white;
  }

  .step-num.gold {
    background: linear-gradient(135deg, #ffb800, #ffd700);
    font-size: 1.1rem;
  }

  .step-body {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .step-body strong {
    font-size: 0.95rem;
    font-weight: 700;
    color: white;
  }

  .step-body span {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.5;
  }

  /* Compare Grid */
  .compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .compare-card {
    border-radius: 18px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: transform 0.3s;
  }

  .compare-card:hover {
    transform: translateY(-3px);
  }

  .basic-card {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .full-card {
    background: rgba(255, 184, 0, 0.08);
    border-color: rgba(255, 184, 0, 0.3);
    box-shadow: 0 4px 20px rgba(255, 184, 0, 0.1);
  }

  .compare-icon {
    font-size: 2rem;
    text-align: center;
  }

  .compare-card h4 {
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    margin: 0;
    color: white;
  }

  .compare-scope {
    font-size: 0.8rem;
    font-weight: 600;
    color: #ffb800;
    text-align: center;
    margin: 0;
  }

  .compare-desc {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    flex: 1;
    margin: 0;
    text-align: center;
  }

  .compare-footer {
    display: block;
    text-align: center;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    transition: all 0.3s;
  }

  .basic-footer {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }

  .full-footer {
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    color: white;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(255, 0, 174, 0.3);
    position: relative;
    overflow: hidden;
  }

  .full-footer::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.25),
      transparent
    );
    transform: rotate(45deg);
    animation: btnSparkle 3s ease-in-out infinite;
  }

  @keyframes btnSparkle {
    0% {
      left: -50%;
    }
    100% {
      left: 150%;
    }
  }

  .full-footer:hover {
    box-shadow: 0 6px 24px rgba(255, 0, 174, 0.5);
    transform: translateY(-2px);
  }

  /* FAQ */
  .faq-section {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 1.75rem;
  }

  .faq-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: white;
    margin: 0 0 1.25rem;
  }

  .faq-item {
    border-radius: 12px;
    margin-bottom: 0.6rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    transition: border-color 0.3s;
  }

  .faq-item.open {
    border-color: rgba(255, 0, 174, 0.35);
    box-shadow: 0 2px 16px rgba(255, 0, 174, 0.1);
  }

  .faq-q {
    width: 100%;
    padding: 0.9rem 1.2rem;
    background: rgba(255, 255, 255, 0.04);
    border: none;
    color: white;
    font-family: 'Rubik', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: right;
    gap: 1rem;
    transition: background 0.2s;
  }

  .faq-item.open .faq-q {
    background: rgba(255, 0, 174, 0.1);
  }
  .faq-q:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .faq-chevron {
    font-size: 0.7rem;
    color: #ffb800;
    flex-shrink: 0;
  }

  .faq-a {
    padding: 1rem 1.2rem;
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.75;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Responsive */
  @media (max-width: 580px) {
    .maze-wrapper {
      padding: 1.75rem 1.25rem;
    }

    .sites-grid,
    .compare-grid {
      grid-template-columns: 1fr;
    }

    .maze-title {
      font-size: 1.5rem;
    }
  }
</style>
