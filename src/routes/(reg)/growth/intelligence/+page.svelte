<script lang="ts">
  import { t } from '$lib/translations';
  import { coverage, gaps, priority } from '$lib/growth/insights';
  import { isClosed } from '$lib/growth/stages';
  import type { ProspectSummary } from '$lib/growth/types';

  /**
   * Network intelligence (§9) from the pipeline's own data: where active
   * providers are thin, which neighbours the network keeps asking for, and
   * who to work on next — with the reasons. Customer-demand signals from the
   * concierge are Phase 2.
   */
  let { data } = $props();
  let rows = $derived<ProspectSummary[]>(data.prospects ?? []);
  let cells = $derived(coverage(rows).slice(0, 40));
  let found = $derived(gaps(rows));
  let top = $derived(
    rows
      .filter((r) => !isClosed(r.stage) && r.stage !== 'activeProvider' && r.stage !== 'joined')
      .map((r) => ({ r, p: priority(r, rows) }))
      .sort((a, b) => b.p.score - a.p.score)
      .slice(0, 10)
  );
</script>

<div class="gr-cols">
  <section class="sh-card gr-card" aria-labelledby="gr-gaps-h">
    <h2 id="gr-gaps-h">{$t('growth.intel.gaps')}</h2>
    {#if !found.length}
      <p class="gr-muted">{$t('growth.intel.noGaps')}</p>
    {:else}
      <ul class="gr-list">
        {#each found as g, i (i)}
          <li>
            {#if g.kind === 'wantedComplement'}
              {$t('growth.intel.wanted', { category: g.category, count: g.mentions ?? 0 })}
            {:else if g.region}
              {$t('growth.intel.thinRegion', { category: g.category, region: g.region, count: g.active })}
            {:else}
              {$t('growth.intel.thin', { category: g.category, count: g.active })}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <p class="gr-muted gr-small">{$t('growth.intel.rule')}</p>
  </section>

  <section class="sh-card gr-card" aria-labelledby="gr-top-h">
    <h2 id="gr-top-h">{$t('growth.intel.recruitNext')}</h2>
    {#if !top.length}
      <p class="gr-muted">{$t('growth.overview.empty')}</p>
    {:else}
      <ol class="gr-list">
        {#each top as { r, p } (r.id)}
          <li>
            <a href="/growth/b/{r.id}"><strong>{r.name}</strong></a> · {r.category ?? ''} · <span class="sh-num">{p.score}</span>
            <div class="gr-muted gr-small">{p.reasons.map((x) => $t(`growth.reason.${x.key}`, { value: x.value ?? '' })).join(' · ')}</div>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
</div>

<section class="sh-card gr-card" aria-labelledby="gr-cov-h">
  <h2 id="gr-cov-h">{$t('growth.intel.coverage')}</h2>
  {#if !cells.length}
    <p class="gr-muted">{$t('growth.overview.empty')}</p>
  {:else}
    <div class="gr-table-wrap">
      <table class="gr-table">
        <thead>
          <tr>
            <th>{$t('growth.form.category')}</th>
            <th>{$t('growth.form.region')}</th>
            <th>{$t('growth.intel.inPipeline')}</th>
            <th>{$t('growth.intel.joined')}</th>
            <th>{$t('growth.intel.active')}</th>
          </tr>
        </thead>
        <tbody>
          {#each cells as c (c.category + '|' + c.region)}
            <tr><td>{c.category}</td><td>{c.region}</td><td>{c.pipeline}</td><td>{c.joined}</td><td><strong>{c.active}</strong></td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  <p class="gr-muted gr-small">{$t('growth.intel.metricRule')}</p>
</section>
