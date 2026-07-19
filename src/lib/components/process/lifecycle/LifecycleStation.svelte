<script>
  /**
   * LifecycleStation — one milestone on the vertical process timeline.
   * Renders the rail dot + connector, a header (label, name, status badge,
   * creation date, link to the object page) and arbitrary detail content.
   */
  let {
    label,
    name = '',
    status = null,          // { text, tone: 'gold'|'sky'|'rose'|'green'|'grey' }
    createdAt = null,
    href = null,            // link to the standalone object page
    hrefLabel = '',
    forumId = null,         // links to /forum/[forumId]
    chatLabel = '',
    tone = 'gold',
    isLast = false,
    lang = 'en',
    children
  } = $props();

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(
        lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar' : 'en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch {
      return '';
    }
  }
</script>

<section class="ls" class:ls--last={isLast}>
  <div class="ls-rail" aria-hidden="true">
    <span class="ls-dot ls-dot--{tone}"></span>
    {#if !isLast}<span class="ls-line"></span>{/if}
  </div>

  <div class="ls-body">
    <header class="ls-head">
      <span class="ls-label ls-label--{tone}">{label}</span>
      {#if name}<h3 class="ls-name">{name}</h3>{/if}
      {#if status}
        <span class="ls-badge ls-badge--{status.tone ?? 'grey'}">{status.text}</span>
      {/if}
      {#if createdAt}
        <span class="ls-date">{formatDate(createdAt)}</span>
      {/if}
      <span class="ls-links">
        {#if forumId}
          <a class="ls-link" href={`/forum/${forumId}`} title={chatLabel}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {chatLabel}
          </a>
        {/if}
        {#if href}
          <a class="ls-link" {href}>
            {hrefLabel}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        {/if}
      </span>
    </header>

    {#if children}
      <div class="ls-content">
        {@render children()}
      </div>
    {/if}
  </div>
</section>

<style>
  .ls {
    display: flex;
    gap: 12px;
  }

  /* ── Rail ─────────────────────────────────────────────────────────────── */
  .ls-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 14px;
    padding-top: 4px;
  }

  .ls-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid var(--pcv-card, #ffffff);
    box-shadow: 0 0 0 1.5px currentColor;
  }
  .ls-dot--gold  { color: var(--gold, #d97706);  background: var(--gold, #d97706); }
  .ls-dot--sky   { color: #38bdf8; background: #38bdf8; }
  .ls-dot--blue  { color: #60a5fa; background: #60a5fa; }
  .ls-dot--rose  { color: var(--rose, #be123c);  background: var(--rose, #be123c); }
  .ls-dot--violet{ color: #a78bfa; background: #a78bfa; }
  .ls-dot--green { color: #34d399; background: #34d399; }
  .ls-dot--grey  { color: #9ca3af; background: #9ca3af; }

  .ls-line {
    flex: 1;
    width: 2px;
    min-height: 18px;
    margin-top: 3px;
    background: var(--pcv-border, #f3e8c8);
    border-radius: 1px;
  }

  /* ── Body ─────────────────────────────────────────────────────────────── */
  .ls-body {
    flex: 1;
    min-width: 0;
    padding-bottom: 18px;
  }
  .ls--last .ls-body { padding-bottom: 4px; }

  .ls-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
  }

  .ls-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .ls-label--gold  { color: var(--badge-gold-text, #b45309); }
  .ls-label--sky   { color: var(--badge-sky-text, #0369a1); }
  .ls-label--blue  { color: #2563eb; }
  .ls-label--rose  { color: var(--badge-rose-text, #be123c); }
  .ls-label--violet{ color: #7c3aed; }
  .ls-label--green { color: var(--badge-green-text, #065f46); }
  .ls-label--grey  { color: var(--badge-grey-text, #6b7280); }

  .ls-name {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--pcv-text, #1c1917);
    word-break: break-word;
  }

  .ls-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
  .ls-badge--gold  { background: var(--badge-gold-bg, rgba(217,119,6,.10));   color: var(--badge-gold-text, #b45309); }
  .ls-badge--sky   { background: var(--badge-sky-bg, rgba(2,132,199,.10));    color: var(--badge-sky-text, #0369a1); }
  .ls-badge--rose  { background: var(--badge-rose-bg, rgba(225,29,72,.10));   color: var(--badge-rose-text, #be123c); }
  .ls-badge--green { background: var(--badge-green-bg, rgba(5,150,105,.10));  color: var(--badge-green-text, #065f46); }
  .ls-badge--grey  { background: var(--badge-grey-bg, rgba(107,114,128,.10)); color: var(--badge-grey-text, #6b7280); }

  .ls-date {
    font-size: 11px;
    color: var(--pcv-text-3, #a8a29e);
  }

  .ls-links {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-inline-start: auto;
  }

  .ls-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    text-decoration: none;
    padding: 2px 8px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-node-border, #e7e5e4);
    transition: color 0.12s, border-color 0.12s, background 0.12s;
    white-space: nowrap;
  }
  .ls-link:hover {
    color: var(--badge-gold-text, #b45309);
    border-color: var(--gold, #f59e0b);
    background: var(--badge-gold-bg, rgba(245,158,11,.08));
  }
  .ls-link svg {
    width: 11px;
    height: 11px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ls-content {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
