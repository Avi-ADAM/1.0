<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { t } from '$lib/translations';

  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));
  let selected = $state(/** @type {'url' | 'describe' | 'manual'} */ ('url'));
  let going = $state(false);

  const choices = $derived([
    {
      id: /** @type {const} */ ('url'),
      emoji: '🔗',
      title: $t('onboard.business.choices.url.title'),
      sub: $t('onboard.business.choices.url.sub'),
      meta: $t('onboard.business.choices.url.meta'),
      chips: [
        {
          label: $t('onboard.business.choices.url.chips.fast'),
          cls: 'suggested'
        },
        { label: $t('onboard.business.choices.url.chips.public'), cls: '' }
      ],
      path: '/onboard/business/url'
    },
    {
      id: /** @type {const} */ ('describe'),
      emoji: '💬',
      title: $t('onboard.business.choices.describe.title'),
      sub: $t('onboard.business.choices.describe.sub'),
      meta: $t('onboard.business.choices.describe.meta'),
      chips: [],
      path: '/onboard/business/describe'
    },
    {
      id: /** @type {const} */ ('manual'),
      emoji: '✍️',
      title: $t('onboard.business.choices.manual.title'),
      sub: $t('onboard.business.choices.manual.sub'),
      meta: $t('onboard.business.choices.manual.meta'),
      chips: [],
      path: '/me?action=createproject'
    }
  ]);

  function go() {
    going = true;
    const c = choices.find((x) => x.id === selected);
    if (c) setTimeout(() => goto(c.path), 220);
  }
</script>

<svelte:head>
  <title>{$t('onboard.business.title')}</title>
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
      label={$t('onboard.business.journey')}
    />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <Plaque
      title={$t('onboard.business.plaque.title')}
      sub={$t('onboard.business.plaque.sub')}
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
      {/each}
    </div>

    <div class="actions">
      <a href="/onboard" class="btn btn-ghost">{$t('onboard.actions.back')}</a>
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
    gap: 12px;
    padding: 4px;
  }
  .options {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    align-items: center;
    justify-content: flex-end;
  }
  .actions .btn-barbi {
    flex: 1;
    max-width: 220px;
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
