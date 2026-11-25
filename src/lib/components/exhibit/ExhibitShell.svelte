<!--
  ExhibitShell — the frame of the /exhibit installation
  (docs/inprogress/PLAN_EXHIBITION_MODE.md §3.0).

  One fixed, unscrollable screen: the living thread field behind, the home
  heart, the story's thread and the language switch on top, the current step
  in the middle. It owns everything that is the same on every step:
    - full screen on the first touch (a browser only allows it after a gesture;
      at the fair Chrome runs with --kiosk anyway), off with `?fs=0`;
    - the keyboard: → / ← forward and back in reading direction, Esc to the
      start, L for the language — never while the visitor is typing;
    - the idle reset.
  The kiosk's tokens (`--ex-*`) and shared classes (`.ex-btn`, `.ex-display`)
  live here, so a step only lays out its own scene.
-->
<script>
  import { onMount } from 'svelte';
  import { t, locale, isRtl } from '$lib/translations';
  import LangSwitch from '$lib/components/onboard/LangSwitch.svelte';
  import { pickLang } from '$lib/stores/pickLang.js';
  import ThreadField from './ThreadField.svelte';
  import ProgressThread from './ProgressThread.svelte';
  import IdleGuard from './IdleGuard.svelte';

  /**
   * @type {{
   *   sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox,
   *   idleSeconds?: number,
   *   fullscreen?: boolean,
   *   children: import('svelte').Snippet
   * }}
   */
  let { sandbox, idleSeconds = 75, fullscreen = true, children } = $props();

  /** @param {EventTarget | null} el */
  const isTyping = (el) =>
    el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

  function enterFullscreen() {
    if (!fullscreen || document.fullscreenElement || !document.fullscreenEnabled) return;
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (isTyping(e.target)) return;
    // While a dialog is open (a step's picker, "Still here?") the keys are its
    // own: Esc closes it, and must not also send the visitor home.
    if (document.querySelector('[aria-modal="true"]')) return;
    const forward = $isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = $isRtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) {
      e.preventDefault();
      sandbox.next();
    } else if (e.key === backward) {
      e.preventDefault();
      sandbox.back();
    } else if (e.key === 'Escape') {
      if (!sandbox.isFirst) {
        e.preventDefault();
        sandbox.reset();
      }
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      pickLang($locale === 'he' ? 'en' : 'he');
    }
  }

  onMount(() => {
    // The kiosk is always the light, warm page, whatever the OS asks for.
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.style.overflow = 'hidden';
    return () => {
      if (hadDark) root.classList.add('dark');
      root.style.overflow = '';
    };
  });
</script>

<svelte:window onkeydown={onKey} onpointerdown={enterFullscreen} />

<div class="exhibit" class:welcome={sandbox.isFirst}>
  <ThreadField attract={sandbox.step === 'welcome'} gather={sandbox.step === 'idea' && !!sandbox.idea} />

  <header class="ex-top">
    <button
      type="button"
      class="home"
      onclick={() => sandbox.reset()}
      aria-label={$t('exhibit.chrome.home')}
      title={$t('exhibit.chrome.home')}
    >
      <span aria-hidden="true">1💗1</span>
    </button>

    {#if !sandbox.isFirst}
      <ProgressThread {sandbox} />
    {:else}
      <span></span>
    {/if}

    <LangSwitch codes={['he', 'en']} big />
  </header>

  <main class="stage">
    {@render children()}
  </main>

  <footer class="hint" aria-hidden="true">{$t('exhibit.chrome.keysHint')}</footer>

  <IdleGuard active={!sandbox.isFirst} seconds={idleSeconds} onreset={() => sandbox.reset()} />
</div>

<style>
  .exhibit {
    --ex-cream: #fffaf2;
    --ex-blush: #fde8ef;
    --ex-pink: #e2127a;
    --ex-pink-deep: #b80069;
    --ex-gold: #d4a12a;
    --ex-gold-soft: #f1dc9f;
    --ex-ink: #3a2418;
    --ex-ink-soft: #7a5a48;
    --ex-sage: #8fa98c;
    --ex-clay: #c98b6b;

    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
    color: var(--ex-ink);
    color-scheme: light;
    font-family: 'Heebo', 'Rubik', system-ui, sans-serif;
    background:
      radial-gradient(ellipse 60% 50% at 15% 10%, rgba(253, 232, 239, 0.95), transparent 70%),
      radial-gradient(ellipse 55% 45% at 90% 85%, rgba(241, 220, 159, 0.55), transparent 70%),
      radial-gradient(ellipse 40% 35% at 80% 15%, rgba(143, 169, 140, 0.18), transparent 70%),
      var(--ex-cream);
    user-select: none;
  }

  .ex-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    padding: clamp(1rem, 2vw, 2rem) clamp(1.5rem, 3vw, 3.5rem);
  }
  .home {
    font-size: clamp(1.6rem, 2vw, 2.4rem);
    font-weight: 800;
    color: var(--ex-ink);
    background: rgba(255, 250, 242, 0.7);
    border: 2px solid var(--ex-gold-soft);
    border-radius: 999px;
    padding: 0.4em 0.9em;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition:
      transform 200ms ease,
      border-color 200ms ease;
  }
  .home:hover {
    transform: scale(1.06);
    border-color: var(--ex-pink);
  }

  .stage {
    position: relative;
    z-index: 1;
    min-height: 0;
    display: grid;
  }

  .hint {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 0.75rem;
    font-size: clamp(0.85rem, 0.9vw, 1.05rem);
    color: var(--ex-ink-soft);
    opacity: 0.7;
  }

  /* ── Shared by every step ─────────────────────────────────────────── */
  .exhibit :global(.ex-display) {
    font-family: 'Sababa', 'Fraunces', 'Heebo', serif;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.01em;
    margin: 0;
  }
  :global(html[lang='en']) .exhibit :global(.ex-display) {
    font-family: 'Fraunces', 'Georgia', serif;
    font-weight: 600;
  }
  .exhibit :global(.ex-btn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6em;
    min-height: 76px;
    padding: 0.55em 1.6em;
    border-radius: 999px;
    font: inherit;
    font-size: clamp(1.35rem, 1.7vw, 2rem);
    font-weight: 700;
    cursor: pointer;
    border: 3px solid transparent;
    transition:
      transform 200ms ease,
      box-shadow 200ms ease,
      background 200ms ease;
  }
  .exhibit :global(.ex-btn-primary) {
    color: #fff;
    background: linear-gradient(135deg, var(--ex-pink), var(--ex-pink-deep));
    box-shadow: 0 14px 34px rgba(184, 0, 105, 0.3);
  }
  .exhibit :global(.ex-btn-primary:hover) {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 20px 44px rgba(184, 0, 105, 0.36);
  }
  .exhibit :global(.ex-btn-ghost) {
    color: var(--ex-ink);
    background: rgba(255, 250, 242, 0.75);
    border-color: var(--ex-gold-soft);
    backdrop-filter: blur(6px);
  }
  .exhibit :global(.ex-btn-ghost:hover) {
    border-color: var(--ex-gold);
    transform: translateY(-2px);
  }
  .exhibit :global(:focus-visible) {
    outline: 4px solid var(--ex-pink);
    outline-offset: 5px;
    border-radius: 18px;
  }
  .exhibit :global(button:disabled) {
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .exhibit :global(*) {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
