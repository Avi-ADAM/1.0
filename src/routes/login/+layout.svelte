<script>
  import { locale } from '$lib/translations';

  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();

  let dir = $derived(
    $locale === 'he' || $locale === 'ar'
      ? /** @type {'rtl'} */ ('rtl')
      : /** @type {'ltr'} */ ('ltr')
  );
</script>

<div class="auth-scene" {dir}>
  <div class="glow glow-pink" aria-hidden="true"></div>
  <div class="glow glow-gold" aria-hidden="true"></div>

  <div class="card-frame">
    <main class="auth-card">
      <a href="/" class="brand" aria-label="1lev1">
        <span class="brand-one">1</span><span class="brand-heart">💗</span><span
          class="brand-one">1</span
        >
      </a>
      <div class="gold-divider" aria-hidden="true"></div>

      {@render children?.()}
    </main>
  </div>
</div>

<style>
  .auth-scene {
    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    display: grid;
    place-items: center;
    padding: 1.5rem 1rem;
    overflow: hidden;
    isolation: isolate;
    font-family: 'Rubik', sans-serif;
    background:
      linear-gradient(
        170deg,
        rgba(255, 240, 250, 0.82) 0%,
        rgba(255, 255, 255, 0.6) 45%,
        rgba(255, 224, 243, 0.85) 100%
      ),
      url(https://res.cloudinary.com/love1/image/upload/v1640287148/nicelove_o5pzyv.svg)
        center / cover no-repeat;
  }

  /* soft atmosphere blobs */
  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.55;
    z-index: -1;
    animation: drift 14s ease-in-out infinite alternate;
  }
  .glow-pink {
    width: 42vmax;
    height: 42vmax;
    top: -14vmax;
    inset-inline-start: -12vmax;
    background: radial-gradient(circle, #ff0092 0%, transparent 65%);
  }
  .glow-gold {
    width: 42vmax;
    height: 42vmax;
    bottom: -12vmax;
    inset-inline-end: -10vmax;
    background: radial-gradient(circle, #d4af37 0%, transparent 68%);
    opacity: 0.75;
    animation-delay: -7s;
  }
  @keyframes drift {
    from {
      transform: translate3d(0, 0, 0) scale(1);
    }
    to {
      transform: translate3d(4vmax, 3vmax, 0) scale(1.08);
    }
  }

  /* gold gradient frame around the card */
  .card-frame {
    width: 100%;
    max-width: 26rem;
    padding: 2.5px;
    border-radius: 1.9rem;
    background: linear-gradient(
      135deg,
      #bf953f,
      #fcf6ba,
      #b38728,
      #fbf5b7,
      #aa771c,
      #fbf5b7,
      #b38728
    );
    background-size: 300% 300%;
    animation:
      card-in 650ms cubic-bezier(0.22, 1, 0.36, 1) both,
      frame-glint 9s ease-in-out infinite;
    box-shadow:
      0 24px 60px -18px rgba(255, 0, 146, 0.3),
      0 10px 34px -12px rgba(179, 135, 40, 0.45);
  }
  @keyframes frame-glint {
    0%,
    100% {
      background-position: 0% 0%;
    }
    50% {
      background-position: 100% 100%;
    }
  }
  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(22px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .auth-card {
    position: relative;
    background: linear-gradient(
      165deg,
      rgba(255, 253, 244, 0.94) 0%,
      rgba(255, 255, 255, 0.9) 45%,
      rgba(255, 246, 221, 0.92) 100%
    );
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: calc(1.9rem - 2.5px);
    padding: 2.25rem 1.75rem 2rem;
    text-align: center;
  }

  /* inner gold hairline — classic double-frame */
  .auth-card::before {
    content: '';
    position: absolute;
    inset: 7px;
    border: 1px solid rgba(191, 149, 63, 0.35);
    border-radius: calc(1.9rem - 9px);
    pointer-events: none;
  }

  .brand {
    position: relative;
    display: inline-flex;
    align-items: baseline;
    gap: 0.15em;
    background: transparent;
    font-family: 'Bellefair', 'Rubik', serif;
    font-size: 2.6rem;
    line-height: 1;
    color: var(--barbi-pink, #ff0092);
    text-decoration: none;
    letter-spacing: 0.04em;
  }
  .brand-one {
    background: linear-gradient(
      110deg,
      #8a6414,
      #bf953f 20%,
      #fcf6ba 40%,
      #b38728 60%,
      #fbf5b7 80%,
      #8a6414
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 4.5s linear infinite;
  }
  .brand-heart {
    font-size: 0.8em;
    display: inline-block;
    transform-origin: center;
    animation: heartbeat 2.6s ease-in-out infinite;
  }
  @keyframes heartbeat {
    0%,
    28%,
    100% {
      transform: scale(1);
    }
    10% {
      transform: scale(1.18);
    }
    20% {
      transform: scale(1.05);
    }
  }

  .gold-divider {
    height: 2.5px;
    width: 7rem;
    margin: 0.9rem auto 0;
    border-radius: 999px;
    background: linear-gradient(
      110deg,
      #bf953f,
      #fcf6ba,
      #b38728,
      #fbf5b7,
      #bf953f
    );
    background-size: 200% auto;
    animation: shimmer 3.5s linear infinite;
  }
  @keyframes shimmer {
    to {
      background-position: 200% center;
    }
  }

  /* ---- shared auth UI, used by the pages rendered inside the card ---- */

  .auth-card :global(.auth-heading) {
    font-family: 'Bellefair', 'Rubik', serif;
    font-size: 1.7rem;
    color: #3d0a2a;
    background: transparent;
    margin: 1.4rem 0 0.25rem;
    line-height: 1.2;
  }

  .auth-card :global(.auth-sub) {
    font-size: 0.9rem;
    color: #8a5a75;
    margin: 0 auto 1.5rem;
    max-width: 19rem;
    line-height: 1.5;
  }

  .auth-card :global(.auth-alert) {
    display: block;
    background: #fff0f8;
    border: 1px solid rgba(255, 0, 146, 0.35);
    color: #c4006f;
    border-radius: 0.9rem;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
    line-height: 1.45;
    margin-bottom: 1.1rem;
    text-align: start;
  }
  .auth-card :global(.auth-alert a) {
    color: #c4006f;
    font-weight: 600;
    text-decoration: underline;
  }

  .auth-card :global(.auth-form) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: start;
  }

  .auth-card :global(.auth-field) {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .auth-card :global(.auth-label) {
    font-size: 0.82rem;
    font-weight: 600;
    color: #5c1440;
    padding-inline-start: 0.25rem;
  }

  .auth-card :global(.auth-input-wrap) {
    position: relative;
    display: flex;
    align-items: center;
  }

  .auth-card :global(.auth-input) {
    width: 100%;
    min-height: 48px;
    border-radius: 0.9rem;
    border: 1px solid #cfa94e;
    background: #fffdf6;
    box-shadow: inset 0 1px 3px rgba(179, 135, 40, 0.12);
    color: #3d0a2a;
    font-size: 0.95rem;
    padding-inline-start: 2.7rem;
    padding-inline-end: 2.7rem;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease;
  }
  .auth-card :global(.auth-input::placeholder) {
    color: #b99a9f;
  }
  .auth-card :global(.auth-input:focus) {
    outline: none;
    border-color: var(--barbi-pink, #ff0092);
    box-shadow: 0 0 0 3px rgba(255, 0, 146, 0.15);
  }
  .auth-card :global(.auth-input.invalid) {
    border-color: #e0245e;
  }

  .auth-card :global(.auth-input-icon) {
    position: absolute;
    inset-inline-start: 0.85rem;
    display: flex;
    color: #b38728;
    pointer-events: none;
  }

  .auth-card :global(.auth-toggle) {
    position: absolute;
    inset-inline-end: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border: none;
    background: none;
    border-radius: 50%;
    color: #8a5a75;
    cursor: pointer;
    transition: background-color 150ms ease;
  }
  .auth-card :global(.auth-toggle:hover) {
    background: rgba(255, 0, 146, 0.08);
    color: var(--barbi-pink, #ff0092);
  }
  .auth-card :global(.auth-toggle:focus-visible) {
    outline: 2px solid var(--barbi-pink, #ff0092);
    outline-offset: 2px;
  }

  .auth-card :global(.auth-row-end) {
    display: flex;
    justify-content: flex-end;
    margin-top: -0.4rem;
  }

  .auth-card :global(.auth-link) {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--barbi-pink, #ff0092);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.15rem 0.25rem;
    border-radius: 0.4rem;
  }
  .auth-card :global(.auth-link:hover) {
    text-decoration: underline;
  }
  .auth-card :global(.auth-link:focus-visible) {
    outline: 2px solid var(--barbi-pink, #ff0092);
    outline-offset: 2px;
  }

  .auth-card :global(.auth-submit) {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    width: 100%;
    min-height: 50px;
    margin-top: 0.35rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(120deg, #ff0092, #d8006f 55%, #ff0092);
    background-size: 200% auto;
    border: 1.5px solid rgba(252, 246, 186, 0.85);
    color: #ffeebc;
    font-family: inherit;
    font-size: 1.02rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    cursor:
      url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg),
      pointer;
    box-shadow:
      0 10px 24px -10px rgba(255, 0, 146, 0.65),
      0 3px 12px -3px rgba(191, 149, 63, 0.5);
    transition:
      background-position 400ms ease,
      transform 180ms ease,
      box-shadow 180ms ease;
  }
  .auth-card :global(.auth-submit:hover:not(:disabled)) {
    background-position: 100% center;
    transform: translateY(-2px);
    box-shadow:
      0 14px 30px -10px rgba(255, 0, 146, 0.7),
      0 4px 16px -3px rgba(191, 149, 63, 0.6);
  }
  .auth-card :global(.auth-submit:focus-visible) {
    outline: 3px solid #b38728;
    outline-offset: 2px;
  }
  .auth-card :global(.auth-submit:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  .auth-card :global(.auth-spinner) {
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    border: 2.5px solid rgba(255, 238, 188, 0.4);
    border-top-color: #ffeebc;
    animation: spin 800ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .auth-card :global(.auth-divider) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.4rem 0;
    color: #9a7a2e;
    font-size: 0.78rem;
  }
  .auth-card :global(.auth-divider::before),
  .auth-card :global(.auth-divider::after) {
    content: '';
    flex: 1;
    height: 1.5px;
    background: linear-gradient(to right, transparent, #cfa94e, transparent);
  }

  .auth-card :global(.auth-secondary) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 46px;
    border-radius: 999px;
    border: 1.5px solid #cfa94e;
    background: linear-gradient(
      165deg,
      rgba(252, 246, 186, 0.35),
      rgba(191, 149, 63, 0.12)
    );
    color: #5c1440;
    font-family: inherit;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition:
      border-color 180ms ease,
      background-color 180ms ease,
      color 180ms ease;
  }
  .auth-card :global(.auth-secondary:hover) {
    border-color: var(--barbi-pink, #ff0092);
    background: rgba(255, 0, 146, 0.05);
    color: var(--barbi-pink, #ff0092);
  }
  .auth-card :global(.auth-secondary:focus-visible) {
    outline: 2px solid var(--barbi-pink, #ff0092);
    outline-offset: 2px;
  }

  .auth-card :global(.auth-success) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 1.2rem 0 0.4rem;
    animation: card-in 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .auth-card :global(.auth-success-icon) {
    display: grid;
    place-items: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 25%, #fff8e1, #ffe9c4);
    border: 2px solid #cfa94e;
    box-shadow: 0 4px 14px -4px rgba(179, 135, 40, 0.55);
    font-size: 1.8rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .glow,
    .brand-heart,
    .gold-divider {
      animation: none;
    }
    .card-frame {
      animation-duration: 1ms;
    }
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 1.9rem 1.25rem 1.6rem;
    }
    .brand {
      font-size: 2.2rem;
    }
  }
</style>
