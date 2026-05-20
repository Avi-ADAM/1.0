<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import { t } from '$lib/translations';

  let selected = $state(/** @type {'cv' | 'describe' | 'manual'} */ ('cv'));
  let going = $state(false);

  const choices = $derived([
    {
      id: /** @type {const} */ ('cv'),
      emoji: '📄',
      title: $t('onboard.provider.choices.cv.title'),
      sub: $t('onboard.provider.choices.cv.sub'),
      meta: $t('onboard.provider.choices.cv.meta'),
      chips: [
        {
          label: $t('onboard.provider.choices.cv.chips.suggested'),
          cls: 'suggested'
        },
        { label: $t('onboard.provider.choices.cv.chips.success'), cls: '' }
      ],
      path: '/onboard/provider/cv'
    },
    {
      id: /** @type {const} */ ('describe'),
      emoji: '💬',
      title: $t('onboard.provider.choices.describe.title'),
      sub: $t('onboard.provider.choices.describe.sub'),
      meta: $t('onboard.provider.choices.describe.meta'),
      chips: [
        { label: $t('onboard.provider.choices.describe.chips.free'), cls: '' }
      ],
      path: '/onboard/provider/describe'
    },
    {
      id: /** @type {const} */ ('manual'),
      emoji: '✍️',
      title: $t('onboard.provider.choices.manual.title'),
      sub: $t('onboard.provider.choices.manual.sub'),
      meta: $t('onboard.provider.choices.manual.meta'),
      chips: [],
      path: '/onboard/provider/manual'
    }
  ]);

  function go() {
    going = true;
    const c = choices.find((x) => x.id === selected);
    if (c) setTimeout(() => goto(c.path), 220);
  }
</script>

<svelte:head>
  <title>{$t('onboard.provider.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip
      stepIdx={4}
      totalSteps={6}
      label={$t('onboard.provider.journey')}
    />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <Plaque
      title={$t('onboard.provider.plaque.title')}
      sub={$t('onboard.provider.plaque.sub')}
    />

    <div class="options">
      {#each choices as c, i (c.id)}
        <button
          type="button"
          class="option-card"
          class:selected={selected === c.id}
          onclick={() => (selected = c.id)}
          in:fly={{
            y: 20,
            duration: 500,
            delay: 120 + i * 80,
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
        {#if i < choices.length - 1}
          <div class="sep">
            <div class="sep-line"></div>
            <span>{$t('onboard.provider.or')}</span>
            <div class="sep-line"></div>
          </div>
        {/if}
      {/each}
    </div>

    <div class="actions">
      <a href="/onboard" class="btn btn-skip">{$t('onboard.actions.back')}</a>
      <button class="btn btn-barbi" onclick={go} disabled={going}>
        {#if going}<span class="spin">⟳</span>{:else}{$t(
            'onboard.actions.continue'
          )}{/if}
      </button>
    </div>
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 4px;
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
  .sep {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #9a6b10;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }
  .sep-line {
    flex: 1;
    height: 1px;
    background: rgba(218, 165, 32, 0.4);
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    align-items: center;
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
