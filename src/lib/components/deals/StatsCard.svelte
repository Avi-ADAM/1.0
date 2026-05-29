<script lang="ts">
  let {
    label,
    value,
    sub = '',
    icon = '',
    variant = 'default',
  }: {
    label:    string;
    value:    string | number;
    sub?:     string;
    icon?:    string;
    variant?: 'default' | 'gold' | 'pink';
  } = $props();
</script>

<div class="stats-card {variant}">
  <div class="stats-main">
    <div class="stats-label">{label}</div>
    <div class="stats-value">{value}</div>
    {#if sub}
      <div class="stats-sub">{@html sub}</div>
    {/if}
  </div>
  
  {#if icon}
    <div class="stats-icon-wrapper">
      <div class="stats-icon">{icon}</div>
    </div>
  {/if}

  <div class="stats-bg-glow"></div>
</div>

<style>
  .stats-card {
    --card-bg: var(--s1, #1a1a1a);
    --accent: var(--gold-l, #fcd34d);
    --text-main: var(--text, #ffffff);
    --text-muted: var(--tm, #a1a1aa);
    
    background: var(--card-bg);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 1.25rem;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 140px;
    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.3);
  }

  .stats-card.gold { --accent: #fcd34d; }
  .stats-card.pink { --accent: #f472b6; }

  .stats-card:hover {
    transform: translateY(-4px);
    border-color: var(--accent);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }

  .stats-main {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
    z-index: 2;
    flex: 1;
  }

  .stats-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    line-height: normal;
  }

  .stats-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1;
    margin: 0.25rem 0;
    transition: color 0.3s;
  }
  .stats-card.gold .stats-value { color: var(--accent); }
  .stats-card.pink .stats-value { color: var(--accent); }

  .stats-sub {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.4;
    margin-top: auto;
  }

  .stats-sub :global(span) {
    font-weight: 700;
  }

  .stats-icon-wrapper {
    position: relative;
    z-index: 2;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }

  .stats-icon {
    font-size: 1.5rem;
    opacity: 0.9;
  }

  .stats-bg-glow {
    position: absolute;
    top: -20%;
    right: -10%;
    width: 60%;
    height: 80%;
    background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
    opacity: 0.03;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .stats-card:hover .stats-bg-glow {
    opacity: 0.08;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .stats-card {
      padding: 1.25rem;
      min-height: 120px;
    }
    .stats-value {
      font-size: 1.75rem;
    }
  }
</style>
