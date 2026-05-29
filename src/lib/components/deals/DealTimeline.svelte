<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import type { TimelineEvent } from '$lib/types';

  let { events }: { events: TimelineEvent[] } = $props();
</script>

<Panel title="ציר זמן">
  <div class="timeline">
    {#each events as e, i (i)}
      <div class="item">
        <div class="dot {e.status}"></div>
        <div class="tl-body">
          <div class="tl-date">{e.date}</div>
          <div class="tl-label">{e.label}</div>
          <div class="tl-desc">{e.desc}</div>
        </div>
      </div>
    {/each}
  </div>
</Panel>

<style>
  .timeline {
    position: relative;
    padding-right: 20px;
  }
  .timeline::before {
    content: '';
    position: absolute;
    right: 8px;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: linear-gradient(to bottom, var(--gold), var(--pink), transparent);
  }

  .item {
    position: relative;
    padding-right: 24px;
    padding-bottom: 24px;
  }
  .item:last-child { padding-bottom: 0; }

  .dot {
    position: absolute;
    right: -4px;
    top: 4px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid var(--bg);
  }
  .dot.done   { background: var(--gold); }
  .dot.active { background: var(--pink-l); box-shadow: 0 0 10px var(--pink-l); }
  .dot.future { background: var(--s4); }

  .tl-body  { display: flex; flex-direction: column; gap: 2px; direction: rtl; }
  .tl-date  { font-size: 10px; color: var(--td); font-weight: 600; line-height: 1.4; }
  .tl-label { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.4; }
  .tl-desc  { font-size: 11px; color: var(--tm); line-height: 1.4; }
</style>
