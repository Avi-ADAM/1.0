<script lang="ts">
  import { t } from '$lib/translations';
  import type { ProspectSummary } from '$lib/growth/types';

  let { data } = $props();
  let rows = $derived<ProspectSummary[]>(data.prospects ?? []);
  let dnc = $derived(rows.filter((r) => r.stage === 'doNotContact'));
  let declined = $derived(rows.filter((r) => r.stage === 'declined'));

  const RULES = ['noInvent', 'sources', 'noAutoSend', 'consent', 'dnc', 'privacy', 'terms'] as const;
</script>

<div class="gr-cols">
  <section class="sh-card gr-card" aria-labelledby="gr-set-h">
    <h2 id="gr-set-h">{$t('growth.settings.config')}</h2>
    <ul class="gr-list">
      <li>{$t('growth.settings.operators', { project: data.growthProjectId ?? '' })}</li>
      <li>{$t('growth.settings.storage')}</li>
      <li>{$t('growth.settings.model')}</li>
    </ul>
    <p class="gr-muted gr-small">{$t('growth.settings.env')}</p>
  </section>

  <section class="sh-card gr-card" aria-labelledby="gr-rules-h">
    <h2 id="gr-rules-h">{$t('growth.settings.rules')}</h2>
    <ul class="gr-list">
      {#each RULES as r (r)}<li>• {$t(`growth.settings.rule.${r}`)}</li>{/each}
    </ul>
  </section>
</div>

<section class="sh-card gr-card" aria-labelledby="gr-dnc-h">
  <h2 id="gr-dnc-h">{$t('growth.settings.dncTitle', { count: dnc.length })}</h2>
  <p class="gr-muted">{$t('growth.settings.dncBody')}</p>
  {#if dnc.length}
    <ul class="gr-list">{#each dnc as r (r.id)}<li><a href="/growth/b/{r.id}">{r.name}</a> · {r.city ?? ''}</li>{/each}</ul>
  {/if}
  <p class="gr-muted gr-small">{$t('growth.settings.declinedCount', { count: declined.length })}</p>
</section>
