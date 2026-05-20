<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { t, locale } from '$lib/translations';

  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));
  let url = $state('');
  let submitting = $state(false);
  let error = $state('');

  // Light validation: must look like an http(s) URL with a dot
  let valid = $derived(/^https?:\/\/.+\..+/i.test(url.trim()));

  function toMeWithPrefill(data) {
    const params = new URLSearchParams();
    params.set('action', 'createproject');
    if (data?.name) params.set('name', data.name);
    if (data?.desc) params.set('desc', data.desc);
    if (data?.details) params.set('details', data.details);
    if (data?.url) params.set('url', data.url);
    if (Array.isArray(data?.vals) && data.vals.length)
      params.set('vals', data.vals.join(','));
    goto(`/me?${params.toString()}`);
  }

  async function submit() {
    if (!valid || submitting) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), lang: $locale })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.ok === false) {
        throw new Error(body?.message ?? `שגיאה ${res.status}`);
      }
      sessionStorage.setItem('onboard.businessResult', JSON.stringify(body));
      sessionStorage.setItem('onboard.businessSource', 'url');
      toMeWithPrefill({ ...body, url: url.trim() });
    } catch (e) {
      error = /** @type {any} */ (e)?.message || 'שגיאה — נסי שוב';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{$t('onboard.business.url_page.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip
      stepIdx={5}
      totalSteps={6}
      label={$t('onboard.business.url_page.journey')}
    />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <Plaque
      title={$t('onboard.business.url_page.plaque.title')}
      sub={$t('onboard.business.url_page.plaque.sub')}
    />

    <div class="tile-info">
      {$t('onboard.business.url_page.info')}
    </div>

    <div class="field" in:fly={{ y: 10, duration: 400, delay: 150 }}>
      <label class="field-label" for="biz-url"
        >{$t('onboard.business.url_page.label')}</label
      >
      <input
        id="biz-url"
        type="url"
        bind:value={url}
        class="input"
        placeholder="https://example.com"
        dir="ltr"
        inputmode="url"
        autocomplete="url"
      />
      <div class="hint" class:ok={valid}>
        {valid
          ? $t('onboard.business.url_page.hint_ok')
          : $t('onboard.business.url_page.hint_err')}
      </div>
    </div>

    {#if error}
      <p class="error-msg" in:fly={{ y: -6, duration: 300 }}>{error}</p>
    {/if}

    <div class="actions">
      <a href="/onboard/business" class="btn btn-ghost"
        >{$t('onboard.actions.choose_other')}</a
      >
      <a href="/me?action=createproject" class="btn btn-skip"
        >{$t('onboard.actions.skip_manual')}</a
      >
      <button
        class="btn btn-barbi"
        onclick={submit}
        disabled={!valid || submitting}
      >
        {#if submitting}
          <span class="spin">⟳</span> {$t('onboard.business.url_page.scanning')}
        {:else}
          {$t('onboard.business.url_page.analyzing')}
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
  .hint {
    font-size: 11px;
    color: #9a6b10;
    margin-top: 4px;
    text-align: end;
  }
  .hint.ok {
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
