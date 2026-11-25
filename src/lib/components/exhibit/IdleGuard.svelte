<!--
  IdleGuard — brings the kiosk back to its welcome screen when the visitor has
  walked away. After `seconds` with no pointer, key or wheel it asks "Still
  here?" and counts `warn` seconds down; any touch of the mouse or keyboard
  keeps the visit going, and at zero `onreset` runs (the sandbox's reset).

  Off while `active` is false — the welcome screen is the idle state itself.
-->
<script>
  import { t } from '$lib/translations';
  import { fade, scale } from 'svelte/transition';

  /** @type {{ active: boolean, seconds?: number, warn?: number, onreset: () => void }} */
  let { active, seconds = 75, warn = 10, onreset } = $props();

  let warning = $state(false);
  let left = $state(0);
  /** @type {HTMLButtonElement | undefined} */
  let stayBtn = $state();

  $effect(() => {
    if (!active) {
      warning = false;
      return;
    }
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let idleTimer;
    /** @type {ReturnType<typeof setInterval> | undefined} */
    let tick;

    const arm = () => {
      clearTimeout(idleTimer);
      clearInterval(tick);
      warning = false;
      idleTimer = setTimeout(startWarning, Math.max(0, seconds - warn) * 1000);
    };
    const startWarning = () => {
      warning = true;
      left = warn;
      tick = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(tick);
          warning = false;
          onreset();
        }
      }, 1000);
    };

    const events = /** @type {const} */ (['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']);
    for (const e of events) window.addEventListener(e, arm, { passive: true });
    arm();
    return () => {
      clearTimeout(idleTimer);
      clearInterval(tick);
      for (const e of events) window.removeEventListener(e, arm);
    };
  });

  $effect(() => {
    if (warning) stayBtn?.focus();
  });

  const R = 54;
  const C = 2 * Math.PI * R;
</script>

{#if warning}
  <div class="idle" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" transition:fade={{ duration: 250 }}>
    <div class="card" transition:scale={{ start: 0.92, duration: 300 }}>
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={R} class="track" />
        <circle
          cx="60"
          cy="60"
          r={R}
          class="fill"
          style="stroke-dasharray:{C};stroke-dashoffset:{C * (1 - left / warn)}"
        />
        <text x="60" y="60" dominant-baseline="central" text-anchor="middle">{left}</text>
      </svg>
      <h2 id="idle-title" class="ex-display">{$t('exhibit.idle.title')}</h2>
      <p>{$t('exhibit.idle.sub', { count: left })}</p>
      <button bind:this={stayBtn} type="button" class="ex-btn ex-btn-primary">{$t('exhibit.idle.stay')}</button>
    </div>
  </div>
{/if}

<style>
  .idle {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: rgba(58, 36, 24, 0.28);
    backdrop-filter: blur(8px);
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: clamp(2rem, 4vw, 4rem) clamp(2.5rem, 6vw, 6rem);
    border-radius: 2.5rem;
    background: var(--ex-cream);
    box-shadow: 0 30px 80px rgba(58, 36, 24, 0.25);
    text-align: center;
  }
  .ring {
    width: clamp(110px, 9vw, 170px);
    transform: rotate(-90deg);
  }
  .ring text {
    transform: rotate(90deg);
    transform-origin: 60px 60px;
    font-size: 40px;
    font-weight: 800;
    fill: var(--ex-ink);
  }
  .track {
    fill: none;
    stroke: var(--ex-gold-soft);
    stroke-width: 8;
  }
  .fill {
    fill: none;
    stroke: var(--ex-pink);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }
  h2 {
    font-size: clamp(2.5rem, 4vw, 4.5rem);
    color: var(--ex-ink);
  }
  p {
    font-size: clamp(1.25rem, 1.6vw, 1.8rem);
    color: var(--ex-ink-soft);
  }
</style>
