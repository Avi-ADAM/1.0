<script>
  let {
    asks = [],
    lang = 'en'
  } = $props();

  let expanded = $state(false);

  const i18n = {
    he: {
      countLabel:    (n) => `${n} בקשות — לחץ להרחבה`,
      collapseLabel: 'כווץ בקשות',
      asks:          'בקשות',
      noAsks:        'אין בקשות',
      openForum:     'פתח פורום',
      noForum:       'אין פורום'
    },
    en: {
      countLabel:    (n) => `${n} ${n === 1 ? 'ask' : 'asks'} — expand`,
      collapseLabel: 'Collapse',
      asks:          'Asks',
      noAsks:        'No asks',
      openForum:     'Open forum',
      noForum:       'No forum'
    },
    ar: {
      countLabel:    (n) => `${n} طلبات — توسيع`,
      collapseLabel: 'طي',
      asks:          'طلبات',
      noAsks:        'لا توجد طلبات',
      openForum:     'فتح المنتدى',
      noForum:       'لا يوجد منتدى'
    }
  };

  let t     = $derived(i18n[lang] ?? i18n.en);
  let count = $derived(asks.length);
</script>

<div class="asks-node">
  <button
    type="button"
    class="asks-badge"
    aria-label={expanded ? t.collapseLabel : t.countLabel(count)}
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    <!-- People icon -->
    <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>

    <span class="asks-label">{t.asks}</span>
    <span role="status" class="asks-count">{count}</span>

    <svg
      viewBox="0 0 24 24"
      class="chevron"
      class:chevron--up={expanded}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  {#if expanded}
    <div class="asks-list" role="list">
      {#if count === 0}
        <p class="asks-empty">{t.noAsks}</p>
      {:else}
        {#each asks as ask (ask.userId)}
          <div class="ask-item" role="listitem">
            <span class="ask-name">{ask.username}</span>
            {#if ask.forumId}
              <button
                type="button"
                class="ask-forum-btn"
                aria-label="{t.openForum}: {ask.username}"
                onclick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.dispatchEvent(
                    new CustomEvent('openchat', {
                      detail: { id: ask.forumId, isNew: false },
                      bubbles: true
                    })
                  );
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            {:else}
              <span class="ask-no-forum">{t.noForum}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .asks-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 5rem;
  }

  /* ── Badge button ──────────────────────────────────────────────────────── */
  .asks-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 9999px;
    border: 1px solid var(--badge-sky-bg, rgba(2,132,199,.25));
    background: var(--badge-sky-bg, rgba(2,132,199,.08));
    color: var(--badge-sky-text, #0369a1);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .asks-badge:hover {
    background: var(--badge-sky-hover, rgba(2,132,199,.14));
    border-color: var(--badge-sky-text, #0369a1);
  }

  .asks-badge:focus-visible {
    outline: 2px solid var(--badge-sky-text, #0369a1);
    outline-offset: 2px;
  }

  .icon {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }

  .asks-label { font-size: 11px; }
  .asks-count { font-size: 13px; font-weight: 700; }

  .chevron {
    width: 10px;
    height: 10px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
    transition: transform 0.2s;
  }
  .chevron--up { transform: rotate(180deg); }

  /* ── Expanded list ─────────────────────────────────────────────────────── */
  .asks-list {
    width: 100%;
    min-width: 10rem;
    max-width: 16rem;
    max-height: 14rem;
    overflow-y: auto;
    border-radius: 8px;
    border: 1px solid var(--pcv-border, #e7e5e4);
    background: var(--pcv-node-bg, #ffffff);
    box-shadow: 0 4px 16px rgba(0,0,0,.08);
  }

  .asks-empty {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--pcv-text-3, #a8a29e);
  }

  .ask-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 12px;
    border-bottom: 1px solid var(--pcv-border, #e7e5e4);
  }
  .ask-item:last-child { border-bottom: none; }

  .ask-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--pcv-text, #1c1917);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ask-forum-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--badge-sky-text, #0369a1);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .ask-forum-btn:hover { background: var(--badge-sky-bg, rgba(2,132,199,.10)); }
  .ask-forum-btn svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ask-no-forum {
    font-size: 10px;
    color: var(--pcv-text-3, #a8a29e);
    flex-shrink: 0;
  }
</style>
