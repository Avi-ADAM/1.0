<script>
  let {
    acts = [],
    onActClick,
    lang = 'en'
  } = $props();

  let showAll = $state(false);

  const i18n = {
    he: {
      showMore:     (n) => `הצג עוד ${n}`,
      showLess:     'הצג פחות',
      actLabel:     'מטלה',
      done:         'בוצע',
      myApproval:   'אישורי',
      validApproval:'אישור תקף',
      noActs:       'אין מטלות'
    },
    en: {
      showMore:     (n) => `+${n} more`,
      showLess:     'Show less',
      actLabel:     'Act',
      done:         'Done',
      myApproval:   'My approval',
      validApproval:'Valid approval',
      noActs:       'No acts'
    },
    ar: {
      showMore:     (n) => `عرض ${n} المزيد`,
      showLess:     'عرض أقل',
      actLabel:     'مهمة',
      done:         'تم',
      myApproval:   'موافقتي',
      validApproval:'موافقة صالحة',
      noActs:       'لا توجد مهام'
    }
  };

  let t          = $derived(i18n[lang] ?? i18n.en);
  let visibleActs = $derived(showAll || acts.length <= 3 ? acts : acts.slice(0, 3));
  let hiddenCount = $derived(acts.length - 3);

  function statusClass(status) {
    if (!status) return 'bdg-grey';
    const s = String(status).toLowerCase();
    if (s === 'done' || s === 'הושלם' || s === '100') return 'bdg-green';
    if (s === 'active' || s === 'פעיל')               return 'bdg-sky';
    if (s === 'pending' || s === 'ממתין')              return 'bdg-gold';
    return 'bdg-grey';
  }

  function actAriaLabel(act) {
    const name   = act?.attributes?.shem ?? '';
    const status = act?.attributes?.status ?? '';
    return status ? `${t.actLabel}: ${name} — ${status}` : `${t.actLabel}: ${name}`;
  }
</script>

<div class="acts-group">
  {#if acts.length === 0}
    <p class="acts-empty">{t.noActs}</p>
  {:else}
    {#each visibleActs as act (act.id)}
      {@const attrs = act?.attributes ?? {}}
      <button
        type="button"
        class="act-node"
        aria-label={actAriaLabel(act)}
        onclick={() => onActClick(act)}
      >
        <span class="act-label">{t.actLabel}</span>
        <span class="act-name">{attrs.shem ?? '—'}</span>

        {#if attrs.status != null}
          <span role="status" class="act-badge {statusClass(attrs.status)}">
            {attrs.status}
          </span>
        {/if}

        <!-- Completion indicators -->
        <div class="act-indicators">
          <span
            class="indicator"
            class:indicator--on={attrs.naasa}
            title={t.done}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span class="sr-only">{t.done}</span>
          </span>

          <span
            class="indicator indicator--user"
            class:indicator--on={attrs.myIshur}
            title={t.myApproval}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="sr-only">{t.myApproval}</span>
          </span>

          <span
            class="indicator indicator--shield"
            class:indicator--on={attrs.valiIshur}
            title={t.validApproval}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="sr-only">{t.validApproval}</span>
          </span>
        </div>
      </button>
    {/each}

    {#if acts.length > 3}
      <button
        type="button"
        class="show-more-btn"
        onclick={() => (showAll = !showAll)}
      >
        {showAll ? t.showLess : t.showMore(hiddenCount)}
      </button>
    {/if}
  {/if}
</div>

<style>
  .acts-group { display: flex; flex-direction: column; gap: 5px; }

  .acts-empty {
    font-size: 12px;
    color: var(--pcv-text-3, #a8a29e);
    padding: 0 4px;
  }

  /* ── Act card ──────────────────────────────────────────────────────────── */
  .act-node {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    min-width: 8rem;
    max-width: 13rem;
    padding: 7px 10px;
    border-radius: 10px;
    border: 1px solid var(--pcv-node-border, #e7e5e4);
    background: var(--pcv-node-bg, #ffffff);
    cursor: pointer;
    text-align: start;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }

  .act-node:hover {
    border-color: var(--gold, #f59e0b);
    box-shadow: 0 0 0 1px rgba(245,158,11,.15), 0 2px 6px rgba(245,158,11,.10);
    background: var(--pcv-node-hover, #fffbf0);
  }

  .act-node:focus-visible {
    outline: 2px solid var(--rose, #e11d48);
    outline-offset: 2px;
  }

  .act-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3, #a8a29e);
  }

  .act-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--pcv-text, #1c1917);
    line-height: 1.35;
    word-break: break-word;
  }

  /* ── Status badges — reuse same vars as ChainNode ──────────────────────── */
  .act-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 2px;
  }
  .bdg-gold  { background: var(--badge-gold-bg,  rgba(245,158,11,.12)); color: var(--badge-gold-text,  #b45309); }
  .bdg-green { background: var(--badge-green-bg, rgba(  5,150,105,.10)); color: var(--badge-green-text, #065f46); }
  .bdg-sky   { background: var(--badge-sky-bg,   rgba(  2,132,199,.10)); color: var(--badge-sky-text,   #0369a1); }
  .bdg-grey  { background: var(--badge-grey-bg,  rgba(107,114,128,.10)); color: var(--badge-grey-text,  #6b7280); }

  /* ── Completion indicators ─────────────────────────────────────────────── */
  .act-indicators {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
  }

  .indicator {
    display: flex;
    align-items: center;
    color: var(--pcv-border, #e0d9cc);
    transition: color 0.12s;
  }
  .indicator svg {
    width: 11px;
    height: 11px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .indicator--on       { color: var(--badge-green-text, #065f46); }
  .indicator--user.indicator--on  { color: var(--badge-sky-text,   #0369a1); }
  .indicator--shield.indicator--on { color: var(--badge-gold-text,  #b45309); }

  /* ── Show more button ──────────────────────────────────────────────────── */
  .show-more-btn {
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border, #e7e5e4);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .show-more-btn:hover {
    background: var(--badge-gold-bg, rgba(245,158,11,.08));
    border-color: var(--gold, #f59e0b);
    color: var(--badge-gold-text, #b45309);
  }
</style>
