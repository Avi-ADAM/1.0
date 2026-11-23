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
  import { stashSeedPlan } from '$lib/onboard/seedPlanHandoff.js';
  import { openBusinessImport } from '$lib/onboard/businessImport.js';
  import { track } from '$lib/analytics/track.js';
  import { downscaleImage } from '$lib/media/downscaleImage.js';

  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));
  let text = $state('');
  let submitting = $state(false);
  let error = $state('');
  /**
   * Draft the rikma's starter boards from the same description. On by default;
   * unticking asks the analysis for the project fields only.
   */
  let withPlan = $state(true);

  /**
   * A catalog, a price list or photos to draft from (PLAN_SUPPLIER_GROWTH SG1).
   * Read by the server and dropped (readDocuments.ts); same limits as there.
   */
  /** @type {File[]} */
  let files = $state([]);
  const MAX_FILES = 6;
  const MAX_TOTAL = 15 * 1024 * 1024;
  let preparing = $state(false);

  let charCount = $derived(text.trim().length);
  let filesOk = $derived(files.length > 0 && files.reduce((n, f) => n + f.size, 0) <= MAX_TOTAL);
  let canSubmit = $derived((charCount >= 60 || filesOk) && !preparing);

  /** @param {Event} e */
  async function addFiles(e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget);
    const picked = Array.from(input.files ?? []);
    input.value = '';
    if (!picked.length) return;
    preparing = true;
    files = [...files, ...(await Promise.all(picked.map((f) => downscaleImage(f))))].slice(0, MAX_FILES);
    preparing = false;
  }

  function request() {
    if (!files.length) {
      return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), lang: $locale, withPlan })
      };
    }
    const form = new FormData();
    for (const f of files) form.append('files', f, f.name);
    if (text.trim()) form.append('text', text.trim());
    form.append('lang', $locale ?? 'he');
    form.append('withPlan', String(withPlan));
    return { method: 'POST', body: form };
  }

  function toMeWithPrefill(data) {
    const params = new URLSearchParams();
    params.set('action', 'createproject');
    if (data?.name) params.set('name', data.name);
    if (data?.desc) params.set('desc', data.desc);
    if (data?.details) params.set('details', data.details);
    if (Array.isArray(data?.vals) && data.vals.length)
      params.set('vals', data.vals.join(','));
    goto(`/me?${params.toString()}`);
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    submitting = true;
    error = '';
    try {
      track('business_analyze', { entry: 'onboard', source: files.length ? 'files' : 'text' });
      const res = await fetch('/api/analyze-business', request());
      const body = await res.json().catch(() => ({}));
      track('business_analyzed', {
        entry: 'onboard',
        ok: res.ok && body?.ok !== false,
        reason: res.ok ? undefined : String(res.status),
        products: body?.blueprint?.products?.length ?? 0
      });
      if (!res.ok || body?.ok === false) {
        if (res.status === 422) throw new Error($t('onboard.business.describe_page.files_error'));
        throw new Error(body?.message ?? $t('common.errorStatus', { status: res.status }));
      }
      sessionStorage.setItem('onboard.businessResult', JSON.stringify(body));
      sessionStorage.setItem('onboard.businessSource', 'describe');
      // With a plan: the whole draft on one review screen, created in one click.
      const importPath = withPlan ? await openBusinessImport(body, text.trim()) : null;
      if (importPath) {
        goto(importPath);
        return;
      }
      // The boards wait here until the rikma is actually approved and created.
      stashSeedPlan(body?.plan, 'describe');
      toMeWithPrefill(body);
    } catch (e) {
      error = /** @type {any} */ (e)?.message || $t('common.errorTryAgain');
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{$t('onboard.business.describe_page.title')}</title>
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
      label={$t('onboard.business.describe_page.journey')}
    />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <Plaque
      title={$t('onboard.business.describe_page.plaque.title')}
      sub={$t('onboard.business.describe_page.plaque.sub')}
    />

    <div class="tile-info">
      {$t('onboard.business.describe_page.info')}
    </div>

    <div class="field" in:fly={{ y: 10, duration: 400, delay: 150 }}>
      <label class="field-label" for="biz-text"
        >{$t('onboard.business.describe_page.label')}</label
      >
      <textarea
        id="biz-text"
        bind:value={text}
        class="input"
        rows="9"
        placeholder={$t('onboard.business.describe_page.placeholder')}
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

    <div class="field">
      <label class="field-label" for="biz-files">{$t('onboard.business.describe_page.files_label')}</label>
      <input
        id="biz-files"
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.csv,image/jpeg,image/png,image/webp,image/heic,.heic"
        onchange={addFiles}
        disabled={submitting || preparing || files.length >= MAX_FILES}
      />
      <div class="char-count">{$t('onboard.business.describe_page.files_hint', { count: MAX_FILES })}</div>
      {#each files as f, i (f.name + i)}
        <div class="file-row">
          <span dir="auto">{f.name}</span>
          <button
            type="button"
            class="file-x"
            aria-label={$t('onboard.business.describe_page.files_remove')}
            onclick={() => (files = files.filter((_, j) => j !== i))}>×</button
          >
        </div>
      {/each}
    </div>

    <label class="plan-opt">
      <input type="checkbox" bind:checked={withPlan} />
      <span>
        {$t('onboard.business.seed_plan.label')}
        <span class="plan-opt-help">{$t('onboard.business.seed_plan.help')}</span>
      </span>
    </label>

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
        disabled={!canSubmit || submitting}
      >
        {#if submitting}
          <span class="spin">⟳</span>
          {$t('onboard.business.describe_page.working')}
        {:else}
          {$t('onboard.business.describe_page.analyzing')}
        {/if}
      </button>
    </div>
  </div>
</ScreenFrame>

<style>
  .file-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.9rem;
  }
  .file-x {
    border: none;
    background: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: inherit;
  }
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
  .plan-opt {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    font-size: 13px;
    color: #574010;
    cursor: pointer;
    text-align: start;
  }
  .plan-opt input {
    margin-top: 3px;
    flex: none;
  }
  .plan-opt-help {
    display: block;
    font-size: 11px;
    opacity: 0.8;
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
