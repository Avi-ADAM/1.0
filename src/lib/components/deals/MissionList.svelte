<script lang="ts">
  import type { Mission, MissionStatus } from '$lib/types';

  let { missions }: { missions: Mission[] } = $props();

  const ICON: Record<MissionStatus, string> = {
    'done':           '✅',
    'in-progress':    '⚡',
    'waiting':        '⏳',
    'needs-approval': '⏳',
  };

  const ICON_CLS: Record<MissionStatus, string> = {
    'done':           'done',
    'in-progress':    'prog',
    'waiting':        'wait',
    'needs-approval': 'approval',
  };

  function statusText(m: Mission): string {
    switch (m.status) {
      case 'done':           return '✓ שולם';
      case 'needs-approval': return '⚡ לאישור';
      case 'in-progress':    return Math.round((m.hoursDone / m.hours) * 100) + '%';
      default:               return '—';
    }
  }

  const STATUS_COLOR: Record<MissionStatus, string> = {
    'done':           '#4ade80',
    'in-progress':    'var(--gold)',
    'waiting':        'var(--tm)',
    'needs-approval': 'var(--pink-l)',
  };
</script>

<div class="list">
  {#each missions as m (m.id)}
    <div class="item" class:needs-approval={m.status === 'needs-approval'}>
      <div class="icon {ICON_CLS[m.status]}">{ICON[m.status]}</div>
      <div class="info">
        <div class="name">{m.name}</div>
        {#if m.sub}<div class="sub">{m.sub}</div>{/if}
      </div>
      <div class="right">
        <div class="hours">{m.hours} שע׳</div>
        <div class="status" style="color:{STATUS_COLOR[m.status]}">{statusText(m)}</div>
      </div>
    </div>
  {/each}
</div>

<style>
  .list { margin-top: 22px; }

  .item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .item:last-child { border-bottom: none; padding-bottom: 0; }
  .item.needs-approval {
    background: var(--pink-d);
    border: 1px solid rgba(200, 21, 95, 0.2);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 6px;
  }

  .icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
  .icon.done     { background: rgba(74, 222, 128, 0.1); }
  .icon.prog     { background: var(--gold-d); }
  .icon.wait     { background: var(--s3); }
  .icon.approval { background: var(--pink-d); }

  .info { flex: 1; min-width: 0; }
  .name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sub { font-size: 11px; color: var(--tm); margin-top: 2px; }

  .right { text-align: left; flex-shrink: 0; }
  .hours  { font-size: 11px; font-weight: 700; color: var(--gold); }
  .status { font-size: 10px; margin-top: 3px; }
</style>
