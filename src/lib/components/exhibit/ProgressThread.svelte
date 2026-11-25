<!--
  The story's progress as a gold thread with five knots. A knot already
  reached is a button back to its step; the current one glows; the ones ahead
  wait. Order follows the document direction, so in Hebrew the story runs
  right-to-left like the text.
-->
<script>
  import { t } from '$lib/translations';
  import { STEPS } from '$lib/exhibit/sandbox.svelte';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox }} */
  let { sandbox } = $props();
</script>

<nav class="thread" aria-label={$t('exhibit.chrome.progress')}>
  <ol>
    {#each STEPS as step, i (step)}
      {@const done = i < sandbox.index}
      {@const current = i === sandbox.index}
      {@const open = i <= sandbox.reached && sandbox.canGo(step)}
      <li class:done class:current>
        <button
          type="button"
          disabled={!open || current}
          aria-current={current ? 'step' : undefined}
          onclick={() => sandbox.go(step)}
        >
          <span class="knot" aria-hidden="true"></span>
          <span class="step-label">{$t(`exhibit.steps.${step}`)}</span>
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .thread ol {
    position: relative;
    display: flex;
    gap: clamp(1.5rem, 4vw, 5rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* The thread itself, behind the knots. */
  .thread ol::before {
    content: '';
    position: absolute;
    top: 14px;
    inset-inline: 14px;
    height: 3px;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--ex-gold-soft), var(--ex-gold), var(--ex-gold-soft));
  }
  button {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font: inherit;
    color: var(--ex-ink-soft);
  }
  button:disabled {
    cursor: default;
  }
  .knot {
    width: 31px;
    height: 31px;
    border-radius: 50%;
    border: 3px solid var(--ex-gold);
    background: var(--ex-cream);
    transition:
      background 300ms ease,
      transform 300ms ease,
      box-shadow 300ms ease;
  }
  .step-label {
    font-size: clamp(0.95rem, 1.1vw, 1.25rem);
    font-weight: 600;
    white-space: nowrap;
  }
  li:not(.done):not(.current) button:disabled .step-label {
    opacity: 0.55;
  }
  .done .knot {
    background: var(--ex-pink);
    border-color: var(--ex-pink);
  }
  .current .knot {
    background: var(--ex-gold);
    transform: scale(1.15);
    box-shadow: 0 0 0 8px rgba(212, 161, 42, 0.22);
    animation: knot-pulse 2.4s ease-in-out infinite;
  }
  .current .step-label {
    color: var(--ex-ink);
  }
  button:not(:disabled):hover .knot {
    transform: scale(1.2);
  }
  @keyframes knot-pulse {
    50% {
      box-shadow: 0 0 0 14px rgba(212, 161, 42, 0.08);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .current .knot {
      animation: none;
    }
  }
</style>
