<script>
  /**
   * The creation form's AI door: write the idea freely and have the form
   * filled, or go to /mcp and let your own agent do it.
   *
   * Our own draft goes through `/api/analyze-business` — the same endpoint
   * business onboarding uses — and hands its answer to the form through
   * `onFilled`. Nothing is created here: the form only gets suggestions, which
   * the member reviews and approves like any assistant draft.
   *
   * Collapsed by default to one slim bar, so the form below keeps its shape.
   */
  import { isRtl, t, locale } from '$lib/translations';
  import Spinner from '$lib/celim/Spinner.svelte';

  /**
   * @typedef {Object} Props
   * @property {(data: any) => void} onFilled - the analysis, as /api/analyze-business returns it
   */

  /** @type {Props} */
  let { onFilled } = $props();

  const MIN = 50;
  const MAX = 6000;

  let open = $state(false);
  let text = $state('');
  let busy = $state(false);
  let error = $state('');
  /** @type {HTMLTextAreaElement | undefined} */
  let area = $state();

  const count = $derived(text.trim().length);
  const ready = $derived(count >= MIN && !busy);

  async function toggle() {
    open = !open;
    if (open) {
      await Promise.resolve();
      area?.focus();
    }
  }

  async function fill() {
    if (!ready) return;
    busy = true;
    error = '';
    try {
      const res = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), lang: $locale, withPlan: true })
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error($t('addnew.aiFill.errLimit'));
      if (res.status === 401) throw new Error($t('addnew.aiFill.errAuth'));
      if (!res.ok || body?.ok === false || !body?.name) throw new Error($t('addnew.aiFill.errGeneric'));
      onFilled(body);
      open = false;
    } catch (e) {
      error = e instanceof Error && e.message ? e.message : $t('addnew.aiFill.errGeneric');
    } finally {
      busy = false;
    }
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      fill();
    }
  }
</script>

{#snippet spark(size = 20)}
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"></path></svg>
{/snippet}

<section class="af" class:af-open={open} aria-labelledby="af-title">
  <div class="af-bar">
    <div class="af-icon">{@render spark(22)}</div>
    <div class="af-titles">
      <h2 id="af-title" class="af-title">{$t('addnew.aiFill.title')}</h2>
      <p class="af-sub">{$t('addnew.aiFill.sub')}</p>
    </div>
    <div class="af-actions">
      <button
        type="button"
        class="af-btn af-btn-gold"
        aria-expanded={open}
        aria-controls="af-panel"
        onclick={toggle}
      >
        {open ? $t('addnew.aiFill.close') : $t('addnew.aiFill.writeFree')}
      </button>
      <a class="af-btn af-btn-ghost" href="/mcp">
        {$t('addnew.aiFill.agentCta')}
        <span class="af-reco">{$t('addnew.aiFill.recommended')}</span>
      </a>
    </div>
  </div>

  {#if open}
    <div id="af-panel" class="af-panel">
      <div class="af-write">
        <label for="af-text" class="af-label">{$t('addnew.aiFill.label')}</label>
        <textarea
          id="af-text"
          bind:this={area}
          bind:value={text}
          onkeydown={onKey}
          maxlength={MAX}
          rows="6"
          class="af-text"
          placeholder={$t('addnew.aiFill.placeholder')}
          aria-describedby="af-hint"
          disabled={busy}
        ></textarea>
        <div class="af-row">
          <small id="af-hint" class="af-hint" aria-live="polite">
            {#if count < MIN}
              {$t('addnew.aiFill.more', { count: MIN - count })}
            {:else}
              {$t('addnew.aiFill.planNote')}
            {/if}
          </small>
          <button type="button" class="af-go" disabled={!ready} onclick={fill}>
            {#if busy}
              <Spinner size="sm" />
              {$t('addnew.aiFill.working')}
            {:else}
              {@render spark(18)}
              {$t('addnew.aiFill.fill')}
            {/if}
          </button>
        </div>
        {#if error}<p class="af-error" role="alert">{error}</p>{/if}
      </div>

      <aside class="af-agent">
        <div class="af-agent-head">
          <span class="af-agent-title">{$t('addnew.aiFill.agentTitle')}</span>
          <span class="af-reco">{$t('addnew.aiFill.recommended')}</span>
        </div>
        <p class="af-agent-body">{$t('addnew.aiFill.agentBody')}</p>
        <p class="af-agent-ex">{$t('addnew.aiFill.agentExample')}</p>
        <a class="af-agent-link" href="/mcp">
          {$t('addnew.aiFill.agentLink')} {$isRtl ? '←' : '→'}
        </a>
      </aside>
    </div>
  {/if}
</section>

<style>
  /* The --bc-* tokens come from the form around it (.bc-root). */
  .af {
    margin-bottom: 28px;
    padding: 16px 20px;
    border-radius: 22px;
    background: var(--bc-card, #171512);
    border: 1px dashed rgba(238, 232, 170, 0.35);
    transition: border-color 0.2s var(--bc-ease, ease);
  }
  .af-open {
    border-style: solid;
    border-color: rgba(238, 232, 170, 0.5);
  }
  .af-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
  }
  .af-icon {
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    border-radius: 9999px;
    display: grid;
    place-items: center;
    color: #3a2a08;
    background: linear-gradient(135deg, #bf953f, #fcf6ba 45%, #aa771c);
  }
  .af-titles {
    flex: 1 1 240px;
    min-width: 0;
  }
  .af-title {
    font-family: var(--bc-display, serif);
    font-size: 20px;
    color: var(--bc-gold, #eee8aa);
  }
  .af-sub {
    font-size: 14px;
    line-height: 1.5;
    color: var(--bc-ink-3, #d8cfc0);
  }
  .af-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .af-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 16px;
    border-radius: 9999px;
    font-family: var(--bc-sans, sans-serif);
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s var(--bc-ease, ease), filter 0.2s var(--bc-ease, ease);
  }
  .af-btn-gold {
    border: 1px solid rgba(238, 232, 170, 0.55);
    background: var(--bc-raised, #201d19);
    color: var(--bc-gold, #eee8aa);
  }
  .af-btn-gold:hover {
    background: #2a2520;
  }
  .af-btn-ghost {
    border: 1px solid rgba(238, 232, 170, 0.3);
    background: transparent;
    color: var(--bc-gold, #eee8aa);
  }
  .af-btn-ghost:hover {
    background: rgba(238, 232, 170, 0.08);
  }
  .af-reco {
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    color: #3a2a08;
    background: var(--bc-gold-warm, #f0c040);
  }

  .af-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--bc-line, rgba(255, 255, 255, 0.06));
  }
  .af-write {
    flex: 2 1 340px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .af-label {
    font-weight: 500;
    font-size: 15px;
    color: var(--bc-ink, #ede5d8);
  }
  .af-text {
    width: 100%;
    min-height: 140px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--bc-edge, rgba(200, 150, 12, 0.35));
    background: var(--bc-well, #0e0d0c);
    color: var(--bc-ink, #ede5d8);
    font-family: var(--bc-sans, sans-serif);
    font-size: 16px;
    line-height: 1.55;
    resize: vertical;
  }
  .af-text::placeholder {
    color: #7d7366;
  }
  .af-text:focus {
    outline: none;
    border-color: var(--bc-pink, #ff4d9e);
    box-shadow: 0 0 0 3px rgba(255, 0, 146, 0.22);
  }
  .af-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .af-hint {
    flex: 1 1 200px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--bc-muted, #9a8f80);
  }
  .af-go {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 22px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: linear-gradient(135deg, #c8155f, #9e0f4a);
    color: #ffffff;
    font-family: var(--bc-sans, sans-serif);
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
  }
  .af-go:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .af-go:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .af-error {
    font-size: 14px;
    color: #ff8fb8;
  }

  .af-agent {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--bc-well, #0e0d0c);
    border: 1px solid var(--bc-line, rgba(255, 255, 255, 0.06));
  }
  .af-agent-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .af-agent-title {
    font-family: var(--bc-display, serif);
    font-size: 18px;
    color: var(--bc-gold, #eee8aa);
  }
  .af-agent-body {
    font-size: 14px;
    line-height: 1.55;
    color: var(--bc-ink-3, #d8cfc0);
  }
  .af-agent-ex {
    font-size: 13px;
    line-height: 1.5;
    font-style: italic;
    color: var(--bc-muted, #9a8f80);
  }
  .af-agent-link {
    margin-top: auto;
    font-weight: 600;
    font-size: 15px;
    color: var(--bc-gold-warm, #f0c040);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
