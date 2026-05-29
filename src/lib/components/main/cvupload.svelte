<script lang="ts">
  import { goto } from '$app/navigation';
  import { locale, t } from '$lib/translations';
  import { get } from 'svelte/store';
  import { fly } from 'svelte/transition';

  // ─── State ───────────────────────────────────────────────────────────────────

  let step: 'upload' | 'loading' = $state('upload');
  let error = $state('');
  let dragging = $state(false);

  // Staged progress used while step === 'loading'.
  // Each stage flips to 'done' as the request crosses each milestone.
  type Stage = 'pending' | 'active' | 'done';
  type StageKey = 'parse' | 'extract' | 'match' | 'ready';
  let stages: Record<StageKey, Stage> = $state({
    parse: 'pending',
    extract: 'pending',
    match: 'pending',
    ready: 'pending'
  });
  let elapsed = $state(0); // sec, drives the visual time-line so users see progress
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;

  // ─── Upload ──────────────────────────────────────────────────────────────────

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/rtf'
  ];

  function startStages() {
    stages = { parse: 'active', extract: 'pending', match: 'pending', ready: 'pending' };
    elapsed = 0;
    elapsedTimer = setInterval(() => {
      elapsed += 1;
      // Heuristic: rotate "active" as time passes — parse ~0–2s, extract ~2–8s, match ~8–14s.
      if (elapsed === 2 && stages.parse === 'active') {
        stages = { ...stages, parse: 'done', extract: 'active' };
      } else if (elapsed === 8 && stages.extract === 'active') {
        stages = { ...stages, extract: 'done', match: 'active' };
      }
    }, 1000);
  }
  function stopStages(success: boolean) {
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = null;
    if (success) {
      stages = { parse: 'done', extract: 'done', match: 'done', ready: 'done' };
    }
  }

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      error = $t('onboard.provider.cv_page.err_size') || 'הקובץ גדול מדי — עד 5MB';
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      error = $t('onboard.provider.cv_page.err_format') || 'פורמט לא נתמך';
      return;
    }

    error = '';
    step = 'loading';
    startStages();

    const form = new FormData();
    form.append('cv', file);
    form.append('lang', get(locale) ?? 'he');

    try {
      const res = await fetch('/api/analyze-cv', { method: 'POST', body: form });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? `שגיאה ${res.status}`);
      }
      const data = await res.json();

      try {
        sessionStorage.setItem('onboard.cvResult', JSON.stringify(data));
        sessionStorage.setItem('onboard.source', 'cv');
      } catch {
        // session storage may be disabled — non-fatal
      }

      stopStages(true);
      // Small delay so the user sees the final ✓ row before navigating.
      setTimeout(() => goto('/onboard/provider/review'), 450);
    } catch (err: unknown) {
      stopStages(false);
      error = err instanceof Error ? err.message : 'שגיאה לא צפויה';
      step = 'upload';
    }
  }

  function onFileInput(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: DragEvent) {
    dragging = false;
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  const stageList: { key: StageKey; label: string; icon: string }[] = $derived([
    { key: 'parse',   label: $t('onboard.provider.cv_page.stage_parse')   || 'קריאת הקובץ',         icon: '📄' },
    { key: 'extract', label: $t('onboard.provider.cv_page.stage_extract') || 'חילוץ עם AI',         icon: '✨' },
    { key: 'match',   label: $t('onboard.provider.cv_page.stage_match')   || 'התאמה לרשימות באתר',  icon: '🔗' },
    { key: 'ready',   label: $t('onboard.provider.cv_page.stage_ready')   || 'מוכן לאישור',          icon: '🗝' }
  ]);
</script>

<!-- ─── Upload ─────────────────────────────────────────────────────────────── -->
{#if step === 'upload'}
  <section class="zone-wrap">
    {#if error}<p class="error">{error}</p>{/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="drop-zone"
      class:dragging
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={(e) => {
        e.preventDefault();
        dragging = false;
      }}
      ondrop={onDrop}
      onclick={() => document.getElementById('cv-input')?.click()}
    >
      <p class="icon">📄</p>
      <p class="big">{$t('onboard.provider.cv_page.drop_title') || 'גררו לכאן או לחצו להעלאה'}</p>
      <p class="sub">PDF · Word · RTF · טקסט — עד 5MB</p>
    </div>
    <input
      id="cv-input"
      type="file"
      accept=".pdf,.docx,.doc,.txt,.md,.rtf"
      hidden
      onchange={onFileInput}
    />
  </section>
{/if}

<!-- ─── Loading (staged checklist) ─────────────────────────────────────────── -->
{#if step === 'loading'}
  <section class="loading-card" in:fly={{ y: 8, duration: 280 }}>
    <div class="loading-title">
      <span class="dot-spin"></span>
      {$t('onboard.provider.cv_page.loading_title') || 'מנתח את קורות החיים שלך'}
      <span class="elapsed">· {elapsed}s</span>
    </div>
    <ul class="stage-list">
      {#each stageList as s (s.key)}
        <li class="stage" class:active={stages[s.key] === 'active'} class:done={stages[s.key] === 'done'}>
          <span class="stage-mark">
            {#if stages[s.key] === 'done'}✓{:else if stages[s.key] === 'active'}<span class="ring"></span>{:else}◯{/if}
          </span>
          <span class="stage-icon">{s.icon}</span>
          <span class="stage-label">{s.label}</span>
        </li>
      {/each}
    </ul>
    <p class="hint">{$t('onboard.provider.cv_page.loading_hint') || 'התהליך לוקח בדרך כלל 10-15 שניות'}</p>
  </section>
{/if}

<style>
  .zone-wrap { width: 100%; }
  .error {
    color: #c0392b;
    font-size: 13px;
    text-align: center;
    margin-bottom: 8px;
  }
  .drop-zone {
    border: 2px dashed rgba(218, 165, 32, 0.45);
    padding: 1.8rem 1rem;
    text-align: center;
    cursor: pointer;
    border-radius: 14px;
    background: rgba(255, 248, 220, 0.35);
    transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
  }
  .drop-zone:hover { transform: translateY(-1px); }
  .drop-zone.dragging {
    border-color: #c98a16;
    background: rgba(246, 195, 77, 0.18);
  }
  .icon { font-size: 36px; margin: 0 0 2px; }
  .big { font-weight: 700; color: #6c4a07; margin: 0; }
  .sub { font-size: 12px; color: #9a6b10; margin: 4px 0 0; }

  /* ── loading checklist ── */
  .loading-card {
    width: 100%;
    background: linear-gradient(140deg, rgba(255, 248, 220, 0.7), rgba(246, 195, 77, 0.18));
    border: 1px solid rgba(218, 165, 32, 0.4);
    border-radius: 16px;
    padding: 14px 16px;
    backdrop-filter: blur(6px);
  }
  .loading-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #6c4a07;
    font-size: 14px;
    margin-bottom: 12px;
  }
  .elapsed {
    margin-inline-start: auto;
    font-weight: 500;
    color: #9a6b10;
    font-size: 12px;
  }
  .dot-spin {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f6c34d, #c98a16);
    box-shadow: 0 0 0 0 rgba(246, 195, 77, 0.6);
    animation: pulse 1.4s ease-out infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(246, 195, 77, 0.55); }
    70% { box-shadow: 0 0 0 10px rgba(246, 195, 77, 0); }
    100% { box-shadow: 0 0 0 0 rgba(246, 195, 77, 0); }
  }

  .stage-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .stage {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(218, 165, 32, 0.2);
    color: #9a6b10;
    font-size: 13.5px;
    transition: background 200ms ease, color 200ms ease, transform 200ms ease;
  }
  .stage.active {
    background: rgba(246, 195, 77, 0.25);
    border-color: #c98a16;
    color: #6c4a07;
    font-weight: 700;
    transform: translateX(0);
  }
  .stage.done {
    background: rgba(2, 200, 130, 0.12);
    border-color: rgba(2, 200, 130, 0.4);
    color: #035a3e;
  }
  .stage-mark {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 900;
    background: rgba(255, 255, 255, 0.7);
    flex-shrink: 0;
  }
  .stage.done .stage-mark {
    background: linear-gradient(135deg, #02ffbb, #02c882);
    color: #023d29;
  }
  .ring {
    width: 12px;
    height: 12px;
    border: 2px solid #c98a16;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .stage-icon { font-size: 16px; }
  .stage-label { flex: 1; }
  .hint {
    margin: 10px 2px 0;
    font-size: 11px;
    color: #9a6b10;
    text-align: center;
  }
</style>
