<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { Resource } from '$lib/types';

  let { resources }: { resources: Resource[] } = $props();
</script>

<Panel title={$t('deals.resourcesTitle')} actionLabel={$t('deals.addResource')}>
  {#each resources as r (r.id)}
    <div class="res">
      <div class="row">
        <span class="name" class:warn={r.needsApproval}>
          {#if r.needsApproval}⚡ {/if}{r.name}
          {#if r.needsApproval}
            <span class="tag">{$t('deals.pendingYourApproval')}</span>
          {/if}
        </span>
        <span class="cost" class:warn={r.needsApproval}>₪ {r.cost.toLocaleString()}</span>
      </div>
      <div class="track">
        <div
          class="fill"
          class:pink={r.needsApproval}
          style="width:{Math.round((r.cost / r.maxCost) * 100)}%"
        ></div>
      </div>
    </div>
  {/each}
</Panel>

<style>
  .res { margin-bottom: 16px; }
  .res:last-child { margin-bottom: 0; }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px;
  }

  .name {
    font-size: 12px;
    color: var(--text);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .name.warn { color: var(--pink-l); }

  .tag {
    font-size: 9px;
    font-weight: 700;
    background: var(--pink-d);
    color: var(--pink-l);
    border: 1px solid rgba(200, 21, 95, 0.25);
    border-radius: 4px;
    padding: 1px 6px;
  }

  .cost { font-size: 12px; font-weight: 700; color: var(--gold); flex-shrink: 0; }
  .cost.warn { color: var(--pink-l); }

  .track {
    height: 5px;
    background: var(--s3);
    border-radius: 99px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--s4), var(--gold-l));
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fill.pink {
    background: linear-gradient(90deg, var(--pink), var(--pink-l));
  }
</style>
