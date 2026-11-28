<!--
  The animated map on /structure: boxes for what a member meets on the site
  (customer, request, founder, dream, rikma, mission, resource, product,
  contribution, income, split), arrows between them, and the consent frame
  around all of it.

  It plays one of two stories - from a request (the default, the direction the
  platform prefers) or from a dream - one step at a time, lighting the boxes
  and arrows that step is about. It starts on its own once it scrolls into
  view, but only when the site's motion setting allows animation; otherwise it
  waits for the reader to step through it. Tapping a box stops the story and
  explains that box instead.

  Everything the picture says is also said in words: the caption under it, and
  the glossary on the page. The arrows are therefore decorative (aria-hidden);
  the boxes are real buttons.
-->
<script>
  import { onMount } from 'svelte';
  import { t, isRtl } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { sceneAnimates } from '$lib/stores/motion.js';
  import { NODES, EDGES, STORIES, CONSENT_FRAME, VIEW_H, HALF_H } from './structureGraph.js';

  const uid = $props.id();
  const STEP_MS = 4200;
  /** @type {('request' | 'dream')[]} */
  const STORY_KEYS = ['request', 'dream'];

  /** @type {'request' | 'dream'} */
  let story = $state('request');
  let step = $state(0);
  let playing = $state(false);
  /** @type {string | null} */
  let selected = $state(null);
  let seen = $state(false);
  /** @type {HTMLElement | undefined} */
  let figureEl = $state();

  let steps = $derived(STORIES[story]);
  let current = $derived(steps[step]);
  let litNodes = $derived(new Set(selected ? [selected] : current.nodes));
  let litEdges = $derived(
    new Set(
      selected
        ? EDGES.filter((e) => e.from === selected || e.to === selected).map((e) => e.key)
        : current.edges
    )
  );
  let consentLit = $derived(!selected && !!current.consent);

  /** @param {number} v */
  const pctY = (v) => `${(v / VIEW_H) * 100}%`;

  onMount(() => {
    if (!figureEl) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen = true;
        if ($sceneAnimates) playing = true;
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(figureEl);
    return () => io.disconnect();
  });

  $effect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      step = (step + 1) % STORIES[story].length;
    }, STEP_MS);
    return () => clearInterval(id);
  });

  /** @param {'request' | 'dream'} next */
  function chooseStory(next) {
    story = next;
    step = 0;
    selected = null;
  }

  /** @param {number} delta */
  function move(delta) {
    playing = false;
    selected = null;
    step = (step + delta + steps.length) % steps.length;
  }

  function togglePlay() {
    selected = null;
    playing = !playing;
  }

  /** @param {string} key */
  function pick(key) {
    playing = false;
    selected = selected === key ? null : key;
  }
</script>

<div class="sm-wrap">
  <div class="sm-tabs" role="group" aria-label={$t('structure.story.choose')}>
    {#each STORY_KEYS as s (s)}
      <button
        type="button"
        class="sm-tab"
        aria-pressed={story === s}
        onclick={() => chooseStory(s)}>{$t(`structure.story.${s}`)}</button
      >
    {/each}
  </div>

  <figure
    class="sm-figure"
    class:seen
    class:animated={$sceneAnimates}
    bind:this={figureEl}
    aria-label={$t('structure.graph.aria')}
  >
    <svg
      class="sm-lines"
      viewBox="0 0 100 {VIEW_H}"
      aria-hidden="true"
      style:transform={$isRtl ? 'scaleX(-1)' : undefined}
    >
      <defs>
        {#each ['idle', 'lit'] as kind (kind)}
          <marker
            id="{uid}-{kind}"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" class="sm-head-{kind}" />
          </marker>
        {/each}
      </defs>
      <rect
        class="sm-frame"
        class:lit={consentLit}
        x={CONSENT_FRAME.x}
        y={CONSENT_FRAME.y}
        width={CONSENT_FRAME.w}
        height={CONSENT_FRAME.h}
        rx="4"
      />
      {#each EDGES as edge, i (edge.key)}
        {@const lit = litEdges.has(edge.key)}
        <path
          d={edge.d}
          class="sm-edge"
          class:lit
          style:--i={i}
          marker-end="url(#{uid}-{lit ? 'lit' : 'idle'})"
        />
      {/each}
    </svg>

    <span class="sm-frame-label" class:lit={consentLit} style:top={pctY(CONSENT_FRAME.y)}>
      <EntityIcon kind="signed" size={13} />
      {$t('structure.graph.consent')}
    </span>

    {#each NODES as node, i (node.key)}
      <button
        type="button"
        class="sm-node"
        class:lit={litNodes.has(node.key)}
        class:picked={selected === node.key}
        style:inset-inline-start="{node.x - node.w / 2}%"
        style:top={pctY(node.y - HALF_H)}
        style:width="{node.w}%"
        style:height={pctY(HALF_H * 2)}
        style:--i={i}
        aria-pressed={selected === node.key}
        onclick={() => pick(node.key)}
      >
        {#if node.entry}
          <span class="sm-entry">{$t('structure.entry')}</span>
        {/if}
        <EntityIcon kind={node.icon} size={15} />
        <span class="sm-label">{$t(`structure.nodes.${node.key}.label`)}</span>
      </button>
    {/each}
  </figure>

  <div class="sm-caption" aria-live={playing ? 'off' : 'polite'}>
    {#if selected}
      <p class="sm-caption-title">{$t(`structure.nodes.${selected}.label`)}</p>
      <p>{$t(`structure.nodes.${selected}.desc`)}</p>
    {:else}
      <p class="sm-caption-title">
        {$t('structure.controls.step', { current: step + 1, total: steps.length })}
      </p>
      <p>{$t(`structure.steps.${current.text}`)}</p>
    {/if}
  </div>

  <div class="sm-controls">
    <button type="button" class="sm-ctl" onclick={() => move(-1)}>
      <span aria-hidden="true">{$isRtl ? '→' : '←'}</span>
      {$t('structure.controls.prev')}
    </button>
    <button type="button" class="sm-ctl sm-ctl-main" onclick={togglePlay}>
      {playing ? $t('structure.controls.pause') : $t('structure.controls.play')}
    </button>
    <button type="button" class="sm-ctl" onclick={() => move(1)}>
      {$t('structure.controls.next')}
      <span aria-hidden="true">{$isRtl ? '←' : '→'}</span>
    </button>
  </div>
  <p class="sm-hint">{$t('structure.controls.hint')}</p>
</div>

<style>
  /* Theme tokens from app.postcss, so the map follows every theme x mode the
     site has instead of a light/dark pair of its own. */
  .sm-wrap {
    --sm-ink: var(--surface-ink);
    --sm-muted: var(--surface-muted);
    --sm-line: color-mix(in srgb, var(--surface-ink) 28%, transparent);
    --sm-accent: var(--surface-accent);
    --sm-gold: var(--gold);
    --sm-box: var(--surface-2);
    --sm-box-lit: color-mix(in srgb, var(--gold) 18%, var(--surface));
    width: 100%;
    max-width: 34rem;
    margin-inline: auto;
  }

  .sm-tabs {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-block-end: 0.75rem;
    flex-wrap: wrap;
  }
  .sm-tab {
    border: 2px solid var(--sm-gold);
    border-radius: 999px;
    padding: 0.35rem 1rem;
    font-weight: 600;
    color: var(--sm-ink);
    background: transparent;
    transition: background-color 0.2s;
  }
  .sm-tab[aria-pressed='true'] {
    background: var(--sm-gold);
    color: #1e293b;
  }

  .sm-figure {
    position: relative;
    width: 100%;
    aspect-ratio: 100 / 122;
    margin: 0;
  }
  .sm-lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .sm-frame {
    fill: none;
    stroke: var(--sm-gold);
    stroke-width: 0.35;
    stroke-dasharray: 1.4 1;
    opacity: 0.55;
    transition: opacity 0.4s, stroke-width 0.4s;
  }
  .sm-frame.lit {
    opacity: 1;
    stroke-width: 0.7;
  }
  .sm-frame-label {
    position: absolute;
    inset-inline: 0;
    margin-inline: auto;
    width: max-content;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.05rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #1e293b;
    background: var(--sm-gold);
    opacity: 0.8;
    transition: opacity 0.4s, transform 0.4s;
  }
  .sm-frame-label.lit {
    opacity: 1;
    transform: translateY(-50%) scale(1.12);
  }

  .sm-edge {
    fill: none;
    stroke: var(--sm-line);
    stroke-width: 0.45;
    stroke-linecap: round;
    transition: stroke 0.35s, stroke-width 0.35s;
  }
  .sm-edge.lit {
    stroke: var(--sm-accent);
    stroke-width: 0.7;
  }
  .animated .sm-edge.lit {
    stroke-dasharray: 1.6 1.1;
    animation: sm-flow 0.9s linear infinite;
  }
  :global(.sm-head-idle) {
    fill: var(--sm-line);
  }
  :global(.sm-head-lit) {
    fill: var(--sm-accent);
  }

  .sm-node {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding-inline: 0.3rem;
    border: 2px solid color-mix(in srgb, var(--sm-gold) 70%, transparent);
    border-radius: 0.75rem;
    background: var(--sm-box);
    color: var(--sm-ink);
    font-weight: 700;
    font-size: clamp(0.72rem, 2.9vw, 0.95rem);
    line-height: 1.1;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
    cursor: pointer;
    transition:
      transform 0.35s,
      opacity 0.35s,
      border-color 0.35s,
      background-color 0.35s,
      box-shadow 0.35s;
  }
  .sm-node:not(.lit) {
    opacity: 0.72;
  }
  .sm-node.lit {
    border-color: var(--sm-accent);
    background: var(--sm-box-lit);
    transform: scale(1.06);
    box-shadow: 0 4px 14px color-mix(in srgb, var(--sm-accent) 30%, transparent);
  }
  .sm-node.picked {
    outline: 3px solid var(--sm-gold);
    outline-offset: 2px;
  }
  .sm-node:focus-visible {
    outline: 3px solid var(--sm-accent);
    outline-offset: 2px;
  }
  .sm-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sm-entry {
    position: absolute;
    top: 0;
    inset-inline: 0;
    margin-inline: auto;
    width: max-content;
    transform: translateY(-60%);
    padding: 0 0.4rem;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--surface);
    background: var(--sm-accent);
    white-space: nowrap;
  }
  /* The entrance: boxes and arrows appear one after another the first time
     the map scrolls into view - only when animation is on. */
  .animated:not(.seen) .sm-node,
  .animated:not(.seen) .sm-edge {
    opacity: 0;
  }
  .animated.seen .sm-node {
    animation: sm-pop 0.5s backwards cubic-bezier(0.2, 0.8, 0.3, 1.2);
    animation-delay: calc(var(--i) * 90ms);
  }
  .animated.seen .sm-edge:not(.lit) {
    animation: sm-fade 0.5s backwards;
    animation-delay: calc(400ms + var(--i) * 60ms);
  }

  .sm-caption {
    min-height: 6.5rem;
    margin-block-start: 1rem;
    padding: 0.75rem 1rem;
    border: 2px solid color-mix(in srgb, var(--sm-gold) 60%, transparent);
    border-radius: 0.75rem;
    background: var(--sm-box);
    color: var(--sm-ink);
    text-align: start;
    line-height: 1.6;
  }
  .sm-caption-title {
    font-weight: 700;
    color: var(--sm-accent);
    margin-block-end: 0.2rem;
  }

  .sm-controls {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-block-start: 0.75rem;
  }
  .sm-ctl {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.45rem 0.9rem;
    border-radius: 0.75rem;
    border: 2px solid var(--sm-gold);
    color: var(--sm-ink);
    font-weight: 600;
    background: transparent;
  }
  .sm-ctl-main {
    background: var(--sm-accent);
    border-color: var(--sm-accent);
    color: var(--surface);
    min-width: 6.5rem;
    justify-content: center;
  }
  .sm-hint {
    margin-block-start: 0.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--sm-muted);
  }

  @keyframes sm-flow {
    to {
      stroke-dashoffset: -2.7;
    }
  }
  @keyframes sm-pop {
    from {
      opacity: 0;
      transform: scale(0.7);
    }
  }
  @keyframes sm-fade {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sm-node,
    .sm-edge,
    .sm-frame,
    .sm-frame-label {
      transition: none;
      animation: none !important;
    }
  }
</style>
