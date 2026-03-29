<script lang="ts">
  import type { PartnershipData } from '$lib/types/chat';
  let { partnerships }: { partnerships: PartnershipData[] } = $props();
</script>

<div class="grid">
  {#each partnerships as p, i}
    <div class="card" style:animation-delay="{i * 60}ms">
      <div class="card-top">
        <div>
          <div class="mono-label">שותפות</div>
          <div class="name">{p.name}</div>
        </div>
        <div class="value-col">
          <div class="value">{p.value}</div>
          <div class="change" class:up={p.trend === 'up'} class:down={p.trend === 'down'}>
            {p.trend === 'up' ? '↑' : '↓'} {p.change}
          </div>
        </div>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">חלקך</div>
          <div class="stat-val stake">{p.stake}</div>
        </div>
        <div class="stat">
          <div class="stat-label">שותפים</div>
          <div class="stat-val">{p.members}</div>
        </div>
      </div>
      <div class="trend-bar">
        <div class="bar-fill" class:up={p.trend === 'up'} class:down={p.trend === 'down'}></div>
      </div>
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 8px;
  }

  .card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
    animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    position: relative;
    overflow: hidden;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .mono-label {
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    margin-bottom: 3px;
  }

  .name {
    font-size: 13px;
    font-weight: 700;
    font-family: var(--font-display);
    color: var(--text);
  }

  .value-col { text-align: left; }

  .value {
    font-size: 15px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--text);
    line-height: 1.2;
  }

  .change {
    font-size: 11px;
    font-family: var(--font-mono);
    margin-top: 2px;
  }
  .change.up   { color: var(--teal); }
  .change.down { color: var(--rose); }

  .stats {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
  }

  .stat-label {
    font-size: 9px;
    color: var(--text-3);
    margin-bottom: 1px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-val {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-2);
  }
  .stake { color: var(--amber); }

  .trend-bar {
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 2px;
    width: 60%;
    animation: grow 0.8s ease both 0.3s;
  }
  .bar-fill.up   { background: var(--teal); }
  .bar-fill.down { background: var(--rose); width: 35%; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes grow {
    from { width: 0; }
  }
</style>
