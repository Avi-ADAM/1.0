<script lang="ts">
  let {
    done,
    inProgress,
    total,
    hoursDone,
    hoursTotal,
  }: {
    done:       number;
    inProgress: number;
    total:      number;
    hoursDone:  number;
    hoursTotal: number;
  } = $props();

  const R    = 48;
  const CIRC = $derived(2 * Math.PI * R); // ≈ 301.59

  const doneLen = $derived((done / total) * CIRC);
  const progLen = $derived((inProgress / total) * CIRC);

  // Both arcs start at the top (–90°), achieved via SVG transform="rotate(-90 60 60)".
  // In-progress arc starts where done arc ends.
  const progOffset = $derived(CIRC - doneLen);
</script>

<div class="wrap">
  <!-- SVG Donut -->
  <div class="chart">
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="gradGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#c8960c" />
          <stop offset="100%" stop-color="#f0c040" />
        </linearGradient>
        <linearGradient id="gradPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#c8155f" />
          <stop offset="100%" stop-color="#ff4d9e" />
        </linearGradient>
      </defs>

      <!-- Track -->
      <circle cx="60" cy="60" r={R} fill="none" stroke="#1c1c1c" stroke-width="14" />

      <!-- Done arc -->
      {#if done > 0}
        <circle
          cx="60" cy="60" r={R}
          fill="none"
          stroke="url(#gradGold)"
          stroke-width="14"
          stroke-dasharray="{doneLen} {CIRC}"
          stroke-dashoffset="0"
          stroke-linecap="round"
          transform="rotate(-90 60 60)"
        />
      {/if}

      <!-- In-progress arc -->
      {#if inProgress > 0}
        <circle
          cx="60" cy="60" r={R}
          fill="none"
          stroke="url(#gradPink)"
          stroke-width="14"
          stroke-dasharray="{progLen} {CIRC}"
          stroke-dashoffset={progOffset}
          stroke-linecap="round"
          transform="rotate(-90 60 60)"
          opacity="0.75"
        />
      {/if}
    </svg>

    <div class="center">
      <div class="fraction">{done}/{total}</div>
      <div class="label">DONE</div>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div class="row">
      <div class="dot-group"><div class="dot gold"></div><span>הושלמו</span></div>
      <span class="val">{done} משימות</span>
    </div>
    <div class="row">
      <div class="dot-group"><div class="dot pink"></div><span>בביצוע</span></div>
      <span class="val">{inProgress} משימות</span>
    </div>
    <div class="row">
      <div class="dot-group"><div class="dot dim"></div><span>טרם החלו</span></div>
      <span class="val">{total - done - inProgress} משימות</span>
    </div>
    <div class="hours">
      <div class="hours-label">סה״כ שעות</div>
      <div class="hours-value">{hoursDone} / {hoursTotal} שע׳</div>
    </div>
  </div>
</div>

<style>
  .wrap {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .chart {
    position: relative;
    flex-shrink: 0;
    width: 120px;
    height: 120px;
  }

  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
  }
  .fraction { font-size: 20px; font-weight: 800; color: var(--gold-l); line-height: 1; }
  .label    { font-size: 9px; color: var(--tm); margin-top: 3px; letter-spacing: 1px; }

  .legend { flex: 1; }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }
  .row:last-of-type { border-bottom: none; }

  .dot-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text);
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.gold { background: var(--gold-l); }
  .dot.pink { background: var(--pink-l); }
  .dot.dim  { background: var(--s4); }

  .val { font-size: 12px; font-weight: 700; color: var(--text); }

  .hours {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .hours-label { font-size: 11px; color: var(--td); margin-bottom: 2px; }
  .hours-value { font-size: 16px; font-weight: 700; color: var(--gold-l); }
</style>
