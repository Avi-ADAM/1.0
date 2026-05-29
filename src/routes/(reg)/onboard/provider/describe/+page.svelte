<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import Tabs from '$lib/components/onboard/Tabs.svelte';
  import { t, locale } from '$lib/translations';

  const providerTabs = $derived([
    { icon: '💡', label: $t('onboard.provider.tabs.values') },
    { icon: '🛠', label: $t('onboard.provider.tabs.skills') },
    { icon: '🎭', label: $t('onboard.provider.tabs.roles') },
    { icon: '🌿', label: $t('onboard.provider.tabs.style') }
  ]);

  let text = $state('');
  let submitting = $state(false);
  let error = $state('');

  let charCount = $derived(text.trim().length);
  let canSubmit = $derived(charCount >= 60);

  async function submit() {
    if (!canSubmit || submitting) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: $locale })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `שגיאה ${res.status}`);
      }
      const result = await res.json();
      sessionStorage.setItem('onboard.cvResult', JSON.stringify(result));
      sessionStorage.setItem('onboard.source', 'describe');
      goto('/onboard/provider/review');
    } catch (e) {
      error = /** @type {any} */ (e)?.message || 'שגיאה — נסו שוב';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{$t('onboard.provider.describe_page.title')}</title>
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
      label={$t('onboard.provider.describe_page.journey')}
    />
  {/snippet}
  {#snippet tabs()}
    <Tabs items={providerTabs} current={0} />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <Plaque
      title={$t('onboard.provider.describe_page.plaque.title')}
      sub={$t('onboard.provider.describe_page.plaque.sub')}
    />

    <div class="tile-info">
      {$t('onboard.provider.describe_page.info')}
    </div>

    <div class="field" in:fly={{ y: 10, duration: 400, delay: 150 }}>
      <label class="field-label" for="story"
        >{$t('onboard.provider.describe_page.label')}</label
      >
      <textarea
        id="story"
        bind:value={text}
        class="input"
        rows="9"
        placeholder={$t('onboard.provider.describe_page.placeholder')}
      ></textarea>
      <div class="char-count" class:ok={canSubmit}>
        {charCount}
        {$t('onboard.business.describe_page.char_count')} · {canSubmit
          ? $t('onboard.business.describe_page.can_continue')
          : $t('onboard.business.describe_page.min_chars').replace(
              '{{count}}',
              '60'
            )}
      </div>
    </div>

    {#if error}
      <p class="error-msg" in:fly={{ y: -6, duration: 300 }}>{error}</p>
    {/if}

    <div class="actions">
      <a href="/onboard/provider" class="btn btn-ghost"
        >{$t('onboard.actions.choose_other')}</a
      >
      <a href="/onboard/provider/manual" class="btn btn-skip"
        >{$t('onboard.actions.skip_manual')}</a
      >
      <button
        class="btn btn-barbi"
        onclick={submit}
        disabled={!canSubmit || submitting}
      >
        {#if submitting}
          <span class="spin">⟳</span>
          {$t('onboard.provider.describe_page.working')}
        {:else}
          {$t('onboard.provider.describe_page.analyzing')}
        {/if}
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
    gap: 12px;
    padding: 4px;
  }
  .field {
    width: 100%;
  }
  textarea.input {
    min-height: 140px;
    line-height: 1.6;
  }
  .char-count {
    font-size: 11px;
    color: #9a6b10;
    margin-top: 4px;
    text-align: end;
  }
  .char-count.ok {
    color: #035a3e;
    font-weight: 700;
  }
  .error-msg {
    padding: 9px 13px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    font-size: 13px;
    color: #b91c1c;
    margin: 0;
    text-align: center;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
    align-items: center;
    justify-content: center;
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
