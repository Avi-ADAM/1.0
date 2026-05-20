<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import Tabs from '$lib/components/onboard/Tabs.svelte';
  import { t, locale } from '$lib/translations';
  import { skil } from '$lib/components/prPr/mi.js';
  import { get } from 'svelte/store';

  /**
   * @typedef {{
   *   input: string,
   *   status: 'matched' | 'suggestion' | 'new',
   *   existingId?: string,
   *   existingLabel?: string,
   *   similarity?: number,
   *   synonyms?: string[]
   * }} MatchResult
   * @typedef {{
   *   matched: { skills: MatchResult[], roles: MatchResult[], methods: MatchResult[], missions: MatchResult[], vallues: MatchResult[] },
   *   suggestions: { skills: MatchResult[], roles: MatchResult[], methods: MatchResult[], missions: MatchResult[], vallues: MatchResult[] },
   *   newItems: { skills: MatchResult[], roles: MatchResult[], methods: MatchResult[], missions: MatchResult[], vallues: MatchResult[] },
   *   tasks?: string[],
   *   proposed_sps?: { name: string, descrip?: string }[],
   *   sourceLang?: 'he' | 'en' | 'mixed' | 'other'
   * }} CvOutput
   */

  const providerTabs = $derived([
    { icon: '💡', label: $t('onboard.provider.tabs.values') },
    { icon: '🛠', label: $t('onboard.provider.tabs.skills') },
    { icon: '🎭', label: $t('onboard.provider.tabs.roles') },
    { icon: '🌿', label: $t('onboard.provider.tabs.style') }
  ]);

  /** @type {CvOutput | null} */
  let data = $state(null);
  /** @type {Record<string, 'on' | 'off'>} */
  let chipState = $state({});
  /** @type {Record<number, 'on' | 'off'>} */
  let resourceState = $state({});
  let saving = $state(false);
  let error = $state('');

  const CATEGORIES = /** @type {const} */ ([
    'vallues',
    'skills',
    'roles',
    'methods',
    'missions'
  ]);

  onMount(() => {
    try {
      const raw = sessionStorage.getItem('onboard.cvResult');
      if (raw) data = JSON.parse(raw);
    } catch {
      // ignore
    }
    if (!data) {
      goto('/onboard/provider');
      return;
    }
    // Ensure vallues exists even if older sessionStorage data lacks it.
    for (const cat of CATEGORIES) {
      const g = /** @type {any} */ (data);
      g.matched[cat] = g.matched[cat] ?? [];
      g.suggestions[cat] = g.suggestions[cat] ?? [];
      g.newItems[cat] = g.newItems[cat] ?? [];
    }
    // Default: matched + new = on, suggestions = off (user opts in)
    for (const cat of CATEGORIES) {
      const m = /** @type {any} */ (data).matched[cat] ?? [];
      const n = /** @type {any} */ (data).newItems[cat] ?? [];
      const s = /** @type {any} */ (data).suggestions[cat] ?? [];
      for (const r of m) chipState[`${cat}:${r.input}`] = 'on';
      for (const r of n) chipState[`${cat}:${r.input}`] = 'on';
      for (const r of s) chipState[`${cat}:${r.input}`] = 'off';
    }
    // Resources default on
    const sps = data.proposed_sps ?? [];
    for (let i = 0; i < sps.length; i++) resourceState[i] = 'on';
  });

  function toggle(cat, input) {
    const k = `${cat}:${input}`;
    chipState[k] = chipState[k] === 'on' ? 'off' : 'on';
  }
  function toggleResource(i) {
    resourceState[i] = resourceState[i] === 'on' ? 'off' : 'on';
  }

  let counts = $derived.by(() => {
    if (!data) return { m: 0, s: 0, n: 0 };
    let m = 0,
      s = 0,
      n = 0;
    for (const cat of CATEGORIES) {
      m += /** @type {any} */ (data).matched[cat]?.length ?? 0;
      s += /** @type {any} */ (data).suggestions[cat]?.length ?? 0;
      n += /** @type {any} */ (data).newItems[cat]?.length ?? 0;
    }
    return { m, s, n };
  });

  /** Build the payload only with items that are "on". */
  function buildPayload() {
    if (!data) return null;
    /** @type {Record<string, {name: string, existingId?: string}[]>} */
    const out = { skills: [], roles: [], methods: [], vallues: [] };
    for (const cat of /** @type {const} */ ([
      'skills',
      'roles',
      'methods',
      'vallues'
    ])) {
      const g = /** @type {any} */ (data);
      const all = [
        ...g.matched[cat],
        ...g.suggestions[cat],
        ...g.newItems[cat]
      ];
      for (const r of all) {
        if (chipState[`${cat}:${r.input}`] !== 'on') continue;
        const useExisting = r.status === 'matched' || r.status === 'suggestion';
        out[cat].push(
          useExisting && r.existingId
            ? {
                name: r.existingLabel ?? r.input,
                existingId: String(r.existingId)
              }
            : { name: r.input }
        );
      }
    }
    const sps = data.proposed_sps ?? [];
    const resources = sps
      .map((sp, i) => ({ ...sp, _i: i }))
      .filter((sp) => resourceState[sp._i] === 'on')
      .map((sp) => ({ name: sp.name, descrip: sp.descrip ?? '' }));
    return { ...out, resources };
  }

  async function persist() {
    if (!data || saving) return false;
    saving = true;
    error = '';
    const payload = buildPayload();
    try {
      const res = await fetch('/api/onboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, lang: $locale })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.ok === false) {
        throw new Error(body?.message ?? $t('onboard.provider.review_page.save_failed', { status: String(res.status) }));
      }
      // Persist for next step too — manual edit reads from here to prefill.
      sessionStorage.setItem('onboard.cvSelection', JSON.stringify(chipState));
      sessionStorage.setItem(
        'onboard.cvSavedCounts',
        JSON.stringify(body.counts ?? {})
      );
      sessionStorage.setItem(
        'onboard.cvSavedIds',
        JSON.stringify(body.ids ?? {})
      );
      // Invalidate SkillSelector's `_fresh` cache so the next mount re-fetches
      // and includes the skills we just created. Without this the manual
      // wizard's Skills step would show no chips for the new entries.
      const curr = get(skil);
      if (Array.isArray(curr) && curr.length > 0 && curr[0]?._fresh) {
        delete curr[0]._fresh;
        skil.set(curr);
      }
      return true;
    } catch (e) {
      error = /** @type {any} */ (e)?.message || $t('onboard.provider.review_page.network_error');
      saving = false;
      return false;
    }
  }

  async function confirm() {
    const ok = await persist();
    if (ok) setTimeout(() => goto('/onboard/done'), 220);
  }

  async function editManual() {
    const ok = await persist();
    if (ok) setTimeout(() => goto('/onboard/provider/manual'), 220);
  }
</script>

<svelte:head>
  <title>{$t('onboard.provider.review_page.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip stepIdx={5} totalSteps={6} label={$t('onboard.provider.review_page.journey')} />
  {/snippet}
  {#snippet tabs()}
    <Tabs items={providerTabs} current={3} />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    {#if !data}
      <div class="tile-info">{$t('onboard.provider.review_page.loading')}</div>
    {:else}
      <Plaque title={$t('onboard.provider.review_page.plaque.title')} sub={$t('onboard.provider.review_page.plaque.sub')} />

      <div class="summary-tile">
        {@html $t('onboard.provider.review_page.summary', {
          total: counts.m + counts.s + counts.n,
          matched: counts.m,
          suggested: counts.s,
          newItems: counts.n
        })}
      </div>

      {#each [
        { key: 'vallues', icon: '💡', hasHint: false },
        { key: 'skills', icon: '🛠', hasHint: false },
        { key: 'roles', icon: '🎭', hasHint: false },
        { key: 'methods', icon: '🌿', hasHint: false },
        { key: 'missions', icon: '🌟', hasHint: true }
      ] as section (section.key)}
        {@const label = $t(`onboard.provider.review_page.sections.${section.key}.label`)}
        {@const hint = section.hasHint ? $t(`onboard.provider.review_page.sections.${section.key}.hint`) : ''}
        {@const matched = /** @type {any} */ (data).matched[section.key] ?? []}
        {@const sugg = /** @type {any} */ (data).suggestions[section.key] ?? []}
        {@const fresh = /** @type {any} */ (data).newItems[section.key] ?? []}
        {#if matched.length + sugg.length + fresh.length > 0}
          <div class="section" in:fly={{ y: 8, duration: 350 }}>
            <div class="sect-sub">{section.icon} {label}</div>
            {#if hint}
              <div class="sect-hint">{hint}</div>
            {/if}
            <div class="chip-row">
              {#each matched as r (r.input)}
                {@const on = chipState[`${section.key}:${r.input}`] === 'on'}
                <button
                  type="button"
                  class="chip matched"
                  class:off={!on}
                  onclick={() => toggle(section.key, r.input)}
                  title={r.synonyms?.[0] ?? ''}
                >
                  {on ? '✓' : '◯'}
                  {r.existingLabel ?? r.input}
                </button>
              {/each}
              {#each sugg as r (r.input)}
                {@const on = chipState[`${section.key}:${r.input}`] === 'on'}
                <button
                  type="button"
                  class="chip suggested"
                  class:off={!on}
                  onclick={() => toggle(section.key, r.input)}
                  title={r.existingLabel ? $t('onboard.provider.review_page.close_to', { label: r.existingLabel }) : ''}
                >
                  {on ? '✓' : '?'}
                  {r.input}
                </button>
              {/each}
              {#each fresh as r (r.input)}
                {@const on = chipState[`${section.key}:${r.input}`] === 'on'}
                <button
                  type="button"
                  class="chip new"
                  class:off={!on}
                  onclick={() => toggle(section.key, r.input)}
                >
                  {on ? '✓' : '+'}
                  {r.input}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      {/each}

      {#if data.proposed_sps?.length}
        <div class="section">
          <div class="sect-sub">{$t('onboard.provider.review_page.resources.label')}</div>
          <div class="sect-hint">
            {$t('onboard.provider.review_page.resources.hint')}
          </div>
          <div class="chip-row">
            {#each data.proposed_sps as sp, i (sp.name + i)}
              {@const on = resourceState[i] === 'on'}
              <button
                type="button"
                class="chip new"
                class:off={!on}
                onclick={() => toggleResource(i)}
                title={sp.descrip ?? ''}
              >
                {on ? '✓' : '+'}
                {sp.name}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if error}
        <p class="error-msg">{error}</p>
      {/if}

      <div class="actions">
        <button
          type="button"
          class="btn btn-ghost"
          onclick={confirm}
          disabled={saving}
        >
          {$t('onboard.provider.review_page.actions.skip')}
        </button>
        <button class="btn btn-barbi" onclick={editManual} disabled={saving}>
          {#if saving}<span class="spin">⟳</span> {$t('onboard.provider.review_page.actions.saving')}{:else}{$t('onboard.provider.review_page.actions.edit')}{/if}
        </button>
      </div>
      <p class="next-hint">
        {$t('onboard.provider.review_page.next_hint')}
      </p>
    {/if}
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 4px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .summary-tile {
    padding: 8px 12px;
    background: rgba(2, 255, 187, 0.12);
    border: 1px solid rgba(2, 200, 130, 0.4);
    border-radius: 12px;
    font-size: 12.5px;
    color: #035a3e;
    text-align: center;
  }
  .summary-tile b {
    color: #024d33;
    font-weight: 800;
    margin: 0 2px;
  }
  .section {
    width: 100%;
  }
  .sect-hint {
    font-size: 11px;
    color: #9a6b10;
    margin: 2px 0 4px;
  }
  .chip-row {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  .chip {
    cursor: pointer;
    transition:
      opacity 0.18s,
      transform 0.18s;
  }
  .chip.off {
    opacity: 0.45;
    text-decoration: line-through;
  }
  .chip:hover {
    transform: translateY(-1px);
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
    justify-content: center;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .next-hint {
    margin: 6px 4px 0;
    font-size: 11.5px;
    color: #9a6b10;
    text-align: center;
    line-height: 1.4;
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
