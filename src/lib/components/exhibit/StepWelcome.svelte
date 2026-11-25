<!--
  Step 1 · Welcome — one question, one button. Behind it the thread field
  keeps gathering into a heart (ExhibitShell sets `attract`), and three short
  lines take turns underneath, so the screen still tells the story to someone
  watching from across the hall.
-->
<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { t } from '$lib/translations';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox }} */
  let { sandbox } = $props();

  const WHISPERS = ['whisper1', 'whisper2', 'whisper3'];
  let shown = $state(0);
  /** @type {HTMLButtonElement | undefined} */
  let cta = $state();

  onMount(() => {
    cta?.focus({ preventScroll: true });
    const id = setInterval(() => (shown = (shown + 1) % WHISPERS.length), 3000);
    return () => clearInterval(id);
  });
</script>

<section class="welcome">
  <h1 class="ex-display" in:fly={{ y: 30, duration: 900 }}>{$t('exhibit.welcome.question')}</h1>

  <div class="whispers" aria-live="off">
    {#key shown}
      <p in:fade={{ duration: 600 }} out:fade={{ duration: 300 }}>{$t(`exhibit.welcome.${WHISPERS[shown]}`)}</p>
    {/key}
  </div>

  <div class="go" in:fly={{ y: 20, duration: 900, delay: 300 }}>
    <button bind:this={cta} type="button" class="ex-btn ex-btn-primary cta" onclick={() => sandbox.next()}>
      {$t('exhibit.welcome.cta')}
      <span class="arrow ltr:-scale-x-100" aria-hidden="true">←</span>
    </button>
    <span class="enter">{$t('exhibit.welcome.pressEnter')}</span>
  </div>
</section>

<style>
  .welcome {
    place-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: clamp(1.5rem, 3vh, 3rem);
    padding-inline: 4vw;
    max-width: 1500px;
  }
  h1 {
    font-size: clamp(3.5rem, 7vw, 9rem);
    color: var(--ex-ink);
    text-shadow: 0 2px 30px rgba(255, 250, 242, 0.9);
    text-wrap: balance;
  }
  .whispers {
    display: grid;
    height: 1.5em;
    font-size: clamp(1.6rem, 2.4vw, 3rem);
  }
  .whispers p {
    grid-area: 1 / 1;
    margin: 0;
    color: var(--ex-pink-deep);
    font-weight: 600;
  }
  .go {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .cta {
    font-size: clamp(1.8rem, 2.4vw, 2.8rem);
    min-height: 100px;
    padding-inline: 2em;
    animation: breathe 3.2s ease-in-out infinite;
  }
  .arrow {
    display: inline-block;
  }
  .enter {
    color: var(--ex-ink-soft);
    font-size: clamp(1rem, 1.2vw, 1.4rem);
  }
  @keyframes breathe {
    50% {
      transform: scale(1.04);
    }
  }
</style>
