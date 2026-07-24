<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { Party } from '$lib/types';

  let { parties }: { parties: Party[] } = $props();
</script>

<Panel title={$t('deals.partiesTitle')}>
  {#each parties as p (p.name)}
    <div class="item">
      <div class="av" style={p.avatarStyle}>{p.initials}</div>
      <div class="info">
        <div class="name">{p.name}</div>
        <div class="role">{p.role}</div>
      </div>
      <div class="badge" class:active={p.status === 'active'} class:waiting={p.status === 'waiting'}>
        {p.status === 'active' ? $t('deals.statusActive') : $t('deals.statusWaiting')}
      </div>
    </div>
  {/each}
</Panel>

<style>
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .item:last-child { border-bottom: none; }

  .av {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .info { flex: 1; }
  .name { font-size: 12px; font-weight: 600; color: var(--text); }
  .role { font-size: 10px; color: var(--tm); margin-top: 1px; }

  .badge {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 6px;
  }
  .badge.active  { background: rgba(74,222,128,.1); color: #4ade80; }
  .badge.waiting { background: var(--gold-d); color: var(--gold); }
</style>
