<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import LangSwitch from '$lib/components/onboard/LangSwitch.svelte';
  import { t } from '$lib/translations';

  let selected = $state(/** @type {'provider' | 'business'} */ ('provider'));
  let going = $state(false);

  const tracks = $derived([
    {
      id: /** @type {const} */ ('provider'),
      emoji: '🧑‍🎨',
      title: $t('onboard.tracks.provider.title'),
      sub: $t('onboard.tracks.provider.sub'),
      meta: $t('onboard.tracks.provider.meta'),
      chips: [
        $t('onboard.tracks.provider.chips.0'),
        $t('onboard.tracks.provider.chips.1'),
        $t('onboard.tracks.provider.chips.2')
      ],
      path: '/onboard/provider'
    },
    {
      id: /** @type {const} */ ('business'),
      emoji: '🏛️',
      title: $t('onboard.tracks.business.title'),
      sub: $t('onboard.tracks.business.sub'),
      meta: $t('onboard.tracks.business.meta'),
      chips: [
        $t('onboard.tracks.business.chips.0'),
        $t('onboard.tracks.business.chips.1'),
        $t('onboard.tracks.business.chips.2')
      ],
      path: '/onboard/business'
    }
  ]);

  function go() {
    going = true;
    const t = tracks.find((x) => x.id === selected);
    if (t) setTimeout(() => goto(t.path), 220);
  }
</script>

<svelte:head>
  <title>{$t('onboard.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&family=Cinzel:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip stepIdx={3} totalSteps={6} label={$t('onboard.journey')} />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <div class="lang-row">
      <LangSwitch />
    </div>
    <Plaque title={$t('onboard.plaque.title')} sub={$t('onboard.plaque.sub')} />

    <div class="tile-info">
      {$t('onboard.tile_info')}
    </div>

    <div class="options">
      {#each tracks as t, i (t.id)}
        <button
          type="button"
          class="option-card"
          class:selected={selected === t.id}
          onclick={() => (selected = t.id)}
          in:fly={{
            y: 20,
            duration: 500,
            delay: 150 + i * 80,
            easing: quintOut
          }}
        >
          <div class="opt-row">
            <div class="opt-emoji-big">{t.emoji}</div>
            <div class="opt-body">
              <div class="opt-title">{t.title}</div>
              <p class="opt-sub">
                {t.sub}<br />
                <span class="opt-meta">{t.meta}</span>
              </p>
            </div>
            <div class="check-mark" class:on={selected === t.id}>
              {#if selected === t.id}✓{/if}
            </div>
          </div>
          <div class="chips">
            {#each t.chips as c (c)}
              <span class="chip">{c}</span>
            {/each}
          </div>
        </button>
      {/each}
    </div>

    <div class="actions">
      <a href="/me" class="btn btn-skip">{$t('onboard.actions.skip')}</a>
      <button class="btn btn-barbi" onclick={go} disabled={going}>
        {#if going}<span class="spin">⟳</span>
          {$t('onboard.actions.going')}{:else}{$t(
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
    padding: 6px 4px;
  }
  .lang-row {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin: -2px 0 -6px;
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
  .check-mark {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    color: #fff;
    border: 2px solid rgba(218, 165, 32, 0.5);
    background: transparent;
    flex-shrink: 0;
  }
  .check-mark.on {
    background: var(--pink, #e91e8c);
    border-color: var(--pink, #e91e8c);
  }
  .chips {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    align-items: center;
  }
  .spin {
    display: inline-block;
    animation: spinit 1s linear infinite;
  }
  @keyframes spinit {
    to {
      transform: rotate(360deg);
    }
  }
</style>
