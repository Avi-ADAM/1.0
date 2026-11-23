<script lang="ts">
  import { t } from '$lib/translations';
  import { dashboardCounts, funnel, nextActions } from '$lib/growth/insights';
  import type { ProspectSummary } from '$lib/growth/types';

  let { data } = $props();
  let rows = $derived<ProspectSummary[]>(data.prospects ?? []);
  // One "now" per render of the data, so the tiles and the to-do list agree.
  let now = $derived.by(() => {
    void rows;
    return Date.now();
  });
  let c = $derived(dashboardCounts(rows, now));
  let steps = $derived(funnel(rows));
  let todo = $derived(nextActions(rows, now));
  let max = $derived(Math.max(1, ...steps.map((s) => s.count)));
  let recent = $derived(
    rows
      .filter((p) => p.lastActivity)
      .sort((a, b) => (a.lastActivity!.at < b.lastActivity!.at ? 1 : -1))
      .slice(0, 10)
  );

  const TILES = [
    ['discovered', '/growth/pipeline'],
    ['researched', '/growth/pipeline?view=profiles'],
    ['awaitingProfileApproval', '/growth/pipeline?view=profiles'],
    ['invitationsReady', '/growth/pipeline?view=outreach'],
    ['invitationsSent', '/growth/pipeline?stage=invitationSent'],
    ['interested', '/growth/pipeline?view=interested'],
    ['registered', '/growth/pipeline?view=joined'],
    ['active', '/growth/pipeline?stage=activeProvider'],
    ['followUpsDue', '/growth/pipeline?view=followups']
  ] as const;
</script>

<div class="gr-grid">
  {#each TILES as [key, href] (key)}
    <a class="sh-card gr-tile" {href}>
      <span class="gr-num">{c[key]}</span>
      <span class="gr-lbl">{$t(`growth.tiles.${key}`)}</span>
    </a>
  {/each}
</div>

<div class="gr-cols">
  <section class="sh-card gr-card" aria-labelledby="gr-next-h">
    <h2 id="gr-next-h">{$t('growth.overview.next')}</h2>
    {#if !todo.length}
      <p class="gr-muted">{rows.length ? $t('growth.overview.allClear') : $t('growth.overview.empty')}</p>
      {#if !rows.length}<a class="sh-btn sh-btn-primary" href="/growth/discover">{$t('growth.overview.start')}</a>{/if}
    {:else}
      <ul class="gr-list">
        {#each todo as a, i (i)}
          <li class="gr-between">
            <span>
              {#if a.key === 'newInCategory'}
                {a.region
                  ? $t('growth.next.newInCategoryRegion', { count: a.count, category: a.category, region: a.region })
                  : $t('growth.next.newInCategory', { count: a.count, category: a.category })}
              {:else}
                {$t(`growth.next.${a.key}`, { count: a.count })}
              {/if}
            </span>
            <a class="sh-btn sh-btn-quiet" href="/growth/pipeline?view={a.view}">{$t('growth.overview.open')}</a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="sh-card gr-card" aria-labelledby="gr-funnel-h">
    <h2 id="gr-funnel-h">{$t('growth.overview.funnel')}</h2>
    <div class="gr-funnel">
      {#each steps as s (s.stage)}
        <div class="gr-funnel-row">
          <span>{$t(`growth.stage.${s.stage}`)}</span>
          <span class="gr-bar" aria-hidden="true"><span style="width:{(s.count / max) * 100}%"></span></span>
          <span class="sh-num">
            {s.count}
            {#if s.fromPrevious != null}<span class="gr-muted gr-small">· {Math.round(s.fromPrevious * 100)}%</span>{/if}
          </span>
        </div>
      {/each}
    </div>
    <p class="gr-muted gr-small">{$t('growth.overview.funnelRule')}</p>
  </section>
</div>

<section class="sh-card gr-card" aria-labelledby="gr-recent-h">
  <h2 id="gr-recent-h">{$t('growth.overview.recent')}</h2>
  {#if !recent.length}
    <p class="gr-muted">{$t('growth.overview.noActivity')}</p>
  {:else}
    <ul class="gr-log">
      {#each recent as p (p.id)}
        <li>
          <span><a href="/growth/b/{p.id}">{p.name}</a> · {$t(`growth.activity.${p.lastActivity!.kind}`)}</span>
          <span class="gr-muted gr-small">{new Date(p.lastActivity!.at).toLocaleString()}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
