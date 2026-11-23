<script lang="ts">
  import { t } from '$lib/translations';
  import ProspectForm from '$lib/components/growth/ProspectForm.svelte';
  import CsvImport from '$lib/components/growth/CsvImport.svelte';

  const SOURCES = ['places', 'websites', 'directories', 'social', 'network'] as const;
</script>

<div class="gr-cols">
  <section class="sh-card gr-card" aria-labelledby="gr-add-h">
    <h2 id="gr-add-h">{$t('growth.discover.addTitle')}</h2>
    <p class="gr-muted">{$t('growth.discover.addBody')}</p>
    <ProspectForm />
  </section>
  <div class="gr-cols" style="grid-template-columns:1fr">
    <CsvImport />
    <section class="sh-card gr-card" aria-labelledby="gr-auto-h">
      <h2 id="gr-auto-h">{$t('growth.discover.autoTitle')}</h2>
      <p class="gr-muted">{$t('growth.discover.autoBody')}</p>
      <ul class="gr-list">
        {#each SOURCES as s (s)}<li>• {$t(`growth.discover.sources.${s}`)}</li>{/each}
      </ul>
      <p class="gr-muted gr-small">{$t('growth.discover.rules')}</p>
    </section>
  </div>
</div>
