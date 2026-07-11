<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import { t } from '$lib/translations';

  let selected = $state(/** @type {'matches' | 'business' | 'supply'} */ ('matches'));
  let going = $state(false);

  const choices = $derived([
    {
      id: /** @type {const} */ ('matches'),
      emoji: '💗',
      title: $t('onboard.done.choices.matches.title'),
      sub: $t('onboard.done.choices.matches.sub'),
      meta: $t('onboard.done.choices.matches.meta'),
      chips: [
        {
          label: $t('onboard.done.choices.matches.chips.realtime'),
          cls: 'suggested'
        },
        { label: $t('onboard.done.choices.matches.chips.guide'), cls: '' }
      ],
      path: '/me?tour=1'
    },
    {
      id: /** @type {const} */ ('business'),
      emoji: '🏛️',
      title: $t('onboard.done.choices.business.title'),
      sub: $t('onboard.done.choices.business.sub'),
      meta: $t('onboard.done.choices.business.meta'),
      chips: [
        { label: $t('onboard.done.choices.business.chips.project'), cls: '' },
        { label: $t('onboard.done.choices.business.chips.products'), cls: '' },
        { label: $t('onboard.done.choices.business.chips.partners'), cls: '' }
      ],
      path: '/onboard/business'
    },
    {
      id: /** @type {const} */ ('supply'),
      emoji: '🗺️',
      title: $t('offerings.onboard.done_supply_title'),
      sub: $t('offerings.onboard.done_supply_sub'),
      meta: $t('offerings.onboard.done_supply_meta'),
      chips: [
        { label: $t('offerings.onboard.done_supply_chip_map'), cls: '' },
        { label: $t('offerings.onboard.done_supply_chip_add'), cls: '' }
      ],
      path: '/demand?lens=supply'
    }
  ]);

  function go() {
    going = true;
    const c = choices.find((x) => x.id === selected);
    if (c) setTimeout(() => goto(c.path), 220);
  }
</script>

<svelte:head>
  <title>{$t('onboard.done.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip
      stepIdx={6}
      totalSteps={6}
      label={$t('onboard.done.journey')}
    />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <div class="heart-wrap">
      <svg
        class="heart-shape"
        viewBox="0 0 320 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hp-done"
            patternUnits="userSpaceOnUse"
            width="18"
            height="20"
          >
            <path
              d="M9 16 C 2 11, 0 6, 4 3 C 6 1, 9 3, 9 6 C 9 3, 12 1, 14 3 C 18 6, 16 11, 9 16 Z"
              fill="url(#hg-done)"
              stroke="#854d0e"
              stroke-width="0.4"
            />
          </pattern>
          <linearGradient id="hg-done" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#facc15" />
            <stop offset="30%" stop-color="#c026d3" />
            <stop offset="60%" stop-color="#0891b2" />
            <stop offset="100%" stop-color="#be185d" />
          </linearGradient>
          <linearGradient id="hg2-done" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fcd34d" />
            <stop offset="50%" stop-color="#a21caf" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>
        </defs>
        <path
          d="M160 250 C 100 220, 30 180, 30 110 C 30 60, 70 30, 110 30 C 135 30, 155 50, 160 70 C 165 50, 185 30, 210 30 C 250 30, 290 60, 290 110 C 290 180, 220 220, 160 250 Z"
          fill="url(#hp-done)"
          stroke="url(#hg2-done)"
          stroke-width="3"
        />
      </svg>
      <div class="plaque-floating">
        <Plaque
          title={$t('onboard.done.plaque.title')}
          sub={$t('onboard.done.plaque.sub')}
        />
      </div>
    </div>

    <div class="tile-info">
      {@html $t('onboard.done.info')}
    </div>

    <div class="options">
      {#each choices as c, i (c.id)}
        <button
          type="button"
          class="option-card"
          class:selected={selected === c.id}
          onclick={() => (selected = c.id)}
          in:fly={{
            y: 18,
            duration: 500,
            delay: 200 + i * 90,
            easing: quintOut
          }}
        >
          <div class="opt-row">
            <div class="opt-emoji-big">{c.emoji}</div>
            <div class="opt-body">
              <div class="opt-title">{c.title}</div>
              <p class="opt-sub">
                {c.sub}<br />
                <span class="opt-meta">{c.meta}</span>
              </p>
              {#if c.chips.length > 0}
                <div class="chips">
                  {#each c.chips as ch (ch.label)}
                    <span class="chip {ch.cls}">{ch.label}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>

    <button class="btn btn-barbi go-btn" onclick={go} disabled={going}>
      {#if going}<span class="spin">⟳</span>{:else}{$t(
          'onboard.actions.continue'
        )}{/if}
    </button>
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px;
    align-items: center;
  }
  .heart-wrap {
    position: relative;
    width: 260px;
    height: 200px;
    margin-bottom: -10px;
  }
  .heart-shape {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 6px 20px rgba(190, 24, 93, 0.22));
    animation: heartbeat-done 3s ease-in-out infinite;
  }
  @keyframes heartbeat-done {
    0%,
    100% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.04);
    }
    60% {
      transform: scale(0.97);
    }
  }
  .plaque-floating {
    position: absolute;
    left: 50%;
    top: 32%;
    transform: translateX(-50%);
    width: 86%;
  }
  .options {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }
  .opt-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .opt-emoji-big {
    font-size: 38px;
    line-height: 1;
  }
  .opt-body {
    flex: 1;
  }
  .opt-meta {
    color: #9a6b10;
    font-size: 11.5px;
  }
  .chips {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .go-btn {
    margin-top: 8px;
    min-width: 200px;
  }
  .spin {
    display: inline-block;
    animation: ssp 1s linear infinite;
  }
  @keyframes ssp {
    to {
      transform: rotate(360deg);
    }
  }
</style>
