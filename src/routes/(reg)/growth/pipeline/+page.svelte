<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { t } from '$lib/translations';
  import { inView, priority, VIEWS, type View } from '$lib/growth/insights';
  import { isStage, STAGES } from '$lib/growth/stages';
  import type { ProspectSummary } from '$lib/growth/types';
  import StageChip from '$lib/components/growth/StageChip.svelte';

  let { data } = $props();
  let rows = $derived<ProspectSummary[]>(data.prospects ?? []);

  let view = $derived<View>(((VIEWS as readonly string[]).includes(page.url.searchParams.get('view') ?? '') ? page.url.searchParams.get('view') : 'all') as View);
  let stage = $derived(isStage(page.url.searchParams.get('stage')) ? page.url.searchParams.get('stage')! : '');
  let q = $state('');
  let category = $state('');
  let sort = $state<'priority' | 'updated' | 'name'>('priority');

  let now = $derived.by(() => {
    void rows;
    return Date.now();
  });
  let categories = $derived([...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))].sort());

  let shown = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    const list = rows
      .filter((r) => inView(r, view, now))
      .filter((r) => !stage || r.stage === stage)
      .filter((r) => !category || r.category === category)
      .filter((r) => !needle || [r.name, r.city, r.region, r.category, r.website].some((v) => v?.toLowerCase().includes(needle)))
      .map((r) => ({ r, p: priority(r, rows, data.demand) }));
    if (sort === 'priority') list.sort((a, b) => b.p.score - a.p.score);
    else if (sort === 'name') list.sort((a, b) => a.r.name.localeCompare(b.r.name));
    else list.sort((a, b) => (a.r.updatedAt < b.r.updatedAt ? 1 : -1));
    return list;
  });

  function setParam(key: string, value: string) {
    const u = new URL(page.url);
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
    goto(u, { keepFocus: true, noScroll: true });
  }
</script>

<section class="sh-card gr-card">
  <div class="sh-pills" role="group" aria-label={$t('growth.pipeline.views')}>
    {#each VIEWS as v (v)}
      <button class="sh-pill" aria-pressed={view === v} onclick={() => setParam('view', v === 'all' ? '' : v)}>
        {$t(`growth.view.${v}`)}
        <span class="sh-pill-count">{rows.filter((r) => inView(r, v, now)).length}</span>
      </button>
    {/each}
  </div>
  <p class="gr-muted gr-small">{$t(`growth.viewHint.${view}`)}</p>

  <div class="gr-row">
    <label class="sh-search" style="flex:1 1 220px">
      <input bind:value={q} placeholder={$t('growth.pipeline.search')} aria-label={$t('growth.pipeline.search')} />
    </label>
    <select class="sh-input" value={stage} onchange={(e) => setParam('stage', e.currentTarget.value)} aria-label={$t('growth.pipeline.stage')}>
      <option value="">{$t('growth.pipeline.anyStage')}</option>
      {#each STAGES as s (s)}<option value={s}>{$t(`growth.stage.${s}`)}</option>{/each}
    </select>
    <select class="sh-input" bind:value={category} aria-label={$t('growth.form.category')}>
      <option value="">{$t('growth.pipeline.anyCategory')}</option>
      {#each categories as c (c)}<option value={c}>{c}</option>{/each}
    </select>
    <select class="sh-input" bind:value={sort} aria-label={$t('growth.pipeline.sort')}>
      <option value="priority">{$t('growth.pipeline.byPriority')}</option>
      <option value="updated">{$t('growth.pipeline.byUpdated')}</option>
      <option value="name">{$t('growth.pipeline.byName')}</option>
    </select>
  </div>

  {#if !shown.length}
    <p class="sh-empty gr-muted">{rows.length ? $t('growth.pipeline.noneHere') : $t('growth.overview.empty')}</p>
    {#if !rows.length}<a class="sh-btn sh-btn-primary" href="/growth/discover">{$t('growth.overview.start')}</a>{/if}
  {:else}
    <div class="gr-table-wrap">
      <table class="gr-table">
        <thead>
          <tr>
            <th>{$t('growth.form.name')}</th>
            <th>{$t('growth.form.category')}</th>
            <th>{$t('growth.pipeline.place')}</th>
            <th>{$t('growth.pipeline.stage')}</th>
            <th>{$t('growth.pipeline.research')}</th>
            <th>{$t('growth.pipeline.priority')}</th>
            <th>{$t('growth.pipeline.followUp')}</th>
          </tr>
        </thead>
        <tbody>
          {#each shown as { r, p } (r.id)}
            <tr>
              <td>
                <a href="/growth/b/{r.id}"><strong>{r.name}</strong></a>
                <div class="gr-muted gr-small">
                  {r.hasEmail ? '✉' : ''}{r.hasPhone ? ' ☎' : ''}{r.website ? ' 🌐' : ''}
                  · {r.sourceKinds.map((k) => $t(`growth.source.${k}`)).join(', ')}
                </div>
              </td>
              <td>{r.category ?? ''}</td>
              <td>{[r.city, r.region].filter(Boolean).join(', ')}</td>
              <td><StageChip stage={r.stage} /></td>
              <td>
                {#if r.researchConfidence}
                  {$t(`growth.confidence.${r.researchConfidence}`)}
                  <div class="gr-muted gr-small">{$t('growth.pipeline.verifiedOf', { verified: r.verifiedClaims, total: r.totalClaims })}</div>
                {:else}<span class="gr-muted">—</span>{/if}
              </td>
              <td title={p.reasons.map((x) => $t(`growth.reason.${x.key}`, { value: x.value ?? '' })).join(' · ')}>
                <span class="sh-num">{p.score}</span>
                <div class="gr-muted gr-small">{p.reasons.slice(0, 2).map((x) => $t(`growth.reason.${x.key}`, { value: x.value ?? '' })).join(' · ')}</div>
              </td>
              <td>
                {#if r.followUpAt}
                  <span class:gr-error={Date.parse(r.followUpAt) <= now}>{new Date(r.followUpAt).toLocaleDateString()}</span>
                {/if}
                {#if r.nextAction}<div class="gr-muted gr-small">{r.nextAction}</div>{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
