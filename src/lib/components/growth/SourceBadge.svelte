<script lang="ts">
  import { t } from '$lib/translations';
  import type { SourceRef } from '$lib/growth/types';

  let { source }: { source: SourceRef | null | undefined } = $props();
</script>

{#if source}
  <span class="gr-muted gr-small">
    {$t('growth.source.from')}
    {#if source.url}
      <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">{$t(`growth.source.${source.kind}`)}</a>
    {:else}
      {$t(`growth.source.${source.kind}`)}
    {/if}
    {#if source.label}· {source.label}{/if}
    · {new Date(source.at).toLocaleDateString()}
  </span>
{:else}
  <span class="gr-muted gr-small">{$t('growth.source.none')}</span>
{/if}
